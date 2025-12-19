import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
      ? await this.productBackgroundRepo.findByIds(dto.productBackgroundIds)
      : [];

    const tempId = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const gcsPath = `product-poses/${dto.productTypeId}/${tempId}/${uuidv4()}.${fileExtension}`;

    // Upload to GCS
    const imageUrl = await this.gcsStorageService.uploadFile(
      file.buffer,
      gcsPath,
      file.mimetype,
    );

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      productTypeId: dto.productTypeId,
      imageUrl,
      productType,
      productBackgrounds,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID
    if (saved.id !== tempId) {
      const newPath = `product-poses/${dto.productTypeId}/${saved.id}/${uuidv4()}.${fileExtension}`;
      const newUrl = await this.gcsStorageService.uploadFile(file.buffer, newPath, file.mimetype);
      await this.gcsStorageService.deleteFile(gcsPath);
      saved.imageUrl = newUrl;
      return this.repo.save(saved);
    }

    return saved;
  }

  async findAll(productTypeId?: string, search?: string) {
    const where: any = {};
    if (productTypeId) where.productTypeId = productTypeId;
    if (search) where.name = ILike(`%${search}%`);

    const results = await this.repo.find({
      where,
      relations: ['productType', 'productType.category', 'productBackgrounds'],
      order: { createdAt: 'DESC' },
    });

    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return results.map(pose => ({
      ...pose,
      imageUrl: pose.imageUrl || pose.imageBase64 || null,
    }));
  }

  async findOne(id: string) {
    const pose = await this.repo.findOne({
      where: { id },
      relations: ['productType', 'productType.category', 'productBackgrounds'],
    });
    if (!pose) throw new NotFoundException('Product pose not found');
    
    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return {
      ...pose,
      imageUrl: pose.imageUrl || pose.imageBase64 || null,
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
        ? await this.productBackgroundRepo.findByIds(dto.productBackgroundIds)
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
      // Delete old image from GCS if exists
      if (pose.imageUrl) {
        try {
          const oldPath = this.gcsStorageService.extractPathFromUrl(pose.imageUrl);
          await this.gcsStorageService.deleteFile(oldPath);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `product-poses/${pose.productTypeId}/${id}/${uuidv4()}.${fileExtension}`;
      const imageUrl = await this.gcsStorageService.uploadFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      pose.imageUrl = imageUrl;
    }

    pose.name = dto.name ?? pose.name;
    pose.description = dto.description ?? pose.description;

    const saved = await this.repo.save(pose);
    
    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return {
      ...saved,
      imageUrl: saved.imageUrl || saved.imageBase64 || null,
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
}
