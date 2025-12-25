import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { ProductPose } from '../../../database/entities/product-pose.entity';
import { CreateProductPoseDto } from './dto/create-product-pose.dto';
import { UpdateProductPoseDto } from './dto/update-product-pose.dto';
import { ProductType } from '../../../database/entities/product-type.entity';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductPosesService {
  constructor(
    @InjectRepository(ProductPose)
    private readonly repo: Repository<ProductPose>,
    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,
    @InjectRepository(ProductBackground)
    private readonly productBackgroundRepo: Repository<ProductBackground>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async create(dto: CreateProductPoseDto, file: Express.Multer.File) {
    const productType = await this.productTypeRepo.findOne({
      where: { id: dto.productTypeId },
    });
    if (!productType) throw new NotFoundException('Product type not found');

    if (!file) throw new BadRequestException('Image file is required');

    const exists = await this.repo.findOne({
      where: { name: dto.name, productTypeId: dto.productTypeId },
    });
    if (exists) throw new BadRequestException('Product pose already exists for this product type');

    const productBackgrounds = dto.productBackgroundIds
      ? await this.productBackgroundRepo.find({
          where: { id: In(dto.productBackgroundIds) },
        })
      : [];

    // Generate temporary ID for path, will update after save
    const tempId = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const gcsPath = `product-poses/${dto.productTypeId}/${tempId}/image.${fileExtension}`;

    // Upload as public file
    const imageUrl = await this.gcsStorageService.uploadPublicFile(
      file.buffer,
      gcsPath,
      file.mimetype,
    );

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      productTypeId: dto.productTypeId,
      imageUrl,
      imagePath: gcsPath,
      productType,
      productBackgrounds,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID if different (overwrite with correct path)
    if (saved.id !== tempId) {
      const newPath = `product-poses/${dto.productTypeId}/${saved.id}/image.${fileExtension}`;
      const newUrl = await this.gcsStorageService.uploadPublicFile(file.buffer, newPath, file.mimetype);
      
      // Delete old file if path changed
      if (gcsPath !== newPath) {
        try {
          await this.gcsStorageService.deleteFile(gcsPath);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }
      
      saved.imageUrl = newUrl;
      saved.imagePath = newPath;
      return this.repo.save(saved);
    }

    return saved;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    productTypeId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 20,
      productTypeId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repo
      .createQueryBuilder('pose')
      .leftJoinAndSelect('pose.productType', 'productType')
      .leftJoinAndSelect('productType.category', 'category')
      .leftJoinAndSelect('pose.productBackgrounds', 'productBackgrounds');

    if (productTypeId) {
      queryBuilder.andWhere('pose.productTypeId = :productTypeId', { productTypeId });
    }

    if (search) {
      queryBuilder.andWhere('pose.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`pose.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [results, total] = await queryBuilder.getManyAndCount();

    // Return only imageUrl (CDN URL), no base64 fallback
    const poses = results.map(pose => ({
      ...pose,
      imageUrl: pose.imageUrl || null,
    }));

    return { poses, total };
  }

  async findOne(id: string) {
    const pose = await this.repo.findOne({
      where: { id },
      relations: ['productType', 'productType.category', 'productBackgrounds'],
    });
    if (!pose) throw new NotFoundException('Product pose not found');
    
    // Return only imageUrl (CDN URL), no base64 fallback
    return {
      ...pose,
      imageUrl: pose.imageUrl || null,
    };
  }

  async update(id: string, dto: UpdateProductPoseDto, file?: Express.Multer.File) {
    const pose = await this.repo.findOne({
      where: { id },
      relations: ['productType', 'productType.category', 'productBackgrounds'],
    });
    if (!pose) throw new NotFoundException('Product pose not found');

    if (dto.productTypeId) {
      const newPt = await this.productTypeRepo.findOne({
        where: { id: dto.productTypeId },
      });
      if (!newPt) throw new NotFoundException('New product type not found');
      pose.productType = newPt;
      pose.productTypeId = dto.productTypeId;
    }

    if (dto.productBackgroundIds !== undefined) {
      pose.productBackgrounds = dto.productBackgroundIds.length > 0
        ? await this.productBackgroundRepo.find({
            where: { id: In(dto.productBackgroundIds) },
          })
        : [];
    }

    if (dto.name) {
      const duplicate = await this.repo.findOne({
        where: {
          name: dto.name,
          productTypeId: pose.productTypeId,
        },
      });
      if (duplicate && duplicate.id !== pose.id) {
        throw new BadRequestException('Product pose already exists for this product type');
      }
    }

    // Handle image upload if provided
    if (file) {
      // Use overwriting strategy: reuse same path if exists, otherwise create new
      // If productTypeId changed, we need a new path
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = pose.imagePath && pose.productTypeId === dto.productTypeId
        ? pose.imagePath // Reuse existing path (overwrite) if productTypeId unchanged
        : `product-poses/${pose.productTypeId}/${id}/image.${fileExtension}`; // Create new path

      // Upload as public file (will overwrite if path exists)
      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      
      pose.imageUrl = imageUrl;
      pose.imagePath = gcsPath;
    }

    pose.name = dto.name ?? pose.name;
    pose.description = dto.description ?? pose.description;

    const saved = await this.repo.save(pose);
    
    // Return only imageUrl (CDN URL), no base64 fallback
    return {
      ...saved,
      imageUrl: saved.imageUrl || null,
    };
  }

  async softDelete(id: string) {
    // Load the pose including soft-deleted ones
    const pose = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!pose) {
      throw new NotFoundException('Product pose not found');
    }

    // Toggle delete/restore
    if (pose.deletedAt) {
      await this.repo.restore(id);
    } else {
      await this.repo.softDelete(id);
    }

    // Return updated entity (same behavior as before)
    return this.repo.findOne({ where: { id } });
  }

  async hardDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Product pose not found');
    }

    // Delete image from GCS if exists
    if (entity.imagePath) {
      try {
        await this.gcsStorageService.deleteFile(entity.imagePath);
      } catch (error) {
        console.error('Failed to delete image from GCS:', error);
      }
    }

    // Hard delete (permanent removal)
    await this.repo.remove(entity);
    return { message: 'Product pose permanently deleted' };
  }
}
