import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { ProductBackground } from '../../../database/entities/product-background.entity';
import { CreateProductBackgroundDto } from './dto/create-product-background.dto';
import { UpdateProductBackgroundDto } from './dto/update-product-background.dto';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductBackgroundsService {
  constructor(
    @InjectRepository(ProductBackground)
    private readonly repo: Repository<ProductBackground>,
    @InjectRepository(ProductTheme)
    private readonly productThemeRepo: Repository<ProductTheme>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async create(dto: CreateProductBackgroundDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');

    const exists = await this.repo.findOne({
      where: { name: dto.name },
    });
    if (exists) throw new BadRequestException('Product background with this name already exists');

    const productThemes = dto.productThemeIds
      ? await this.productThemeRepo.find({
          where: { id: In(dto.productThemeIds) },
        })
      : [];

    // Generate temporary ID for path, will update after save
    const tempId = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const gcsPath = `product-backgrounds/${tempId}/image.${fileExtension}`;

    // Upload as public file
    const imageUrl = await this.gcsStorageService.uploadPublicFile(
      file.buffer,
      gcsPath,
      file.mimetype,
    );

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      imageUrl,
      imagePath: gcsPath,
      productThemes,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID if different (overwrite with correct path)
    if (saved.id !== tempId) {
      const newPath = `product-backgrounds/${saved.id}/image.${fileExtension}`;
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
    search?: string;
    productThemeId?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      productThemeId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const qb = this.repo
      .createQueryBuilder('background')
      .leftJoinAndSelect('background.productThemes', 'productTheme')
      .where('background.deleted_at IS NULL');

    if (search) {
      qb.andWhere('background.name ILIKE :search', { search: `%${search}%` });
    }

    if (productThemeId) {
      qb.andWhere('productTheme.id = :productThemeId', { productThemeId });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`background.${sortField}`, sortOrder);

    // Apply pagination
    qb.skip((page - 1) * limit).take(limit);

    const [results, total] = await qb.getManyAndCount();
    
    // Return only imageUrl (CDN URL), no base64 fallback
    const backgrounds = results.map(bg => ({
      ...bg,
      imageUrl: bg.imageUrl || null,
    }));

    return { backgrounds, total };
  }

  async findOne(id: string) {
    const productBackground = await this.repo.findOne({
      where: { id },
      relations: ['productThemes'],
    });
    if (!productBackground) throw new NotFoundException('Product background not found');
    
    // Return only imageUrl (CDN URL), no base64 fallback
    return {
      ...productBackground,
      imageUrl: productBackground.imageUrl || null,
    };
  }

  async update(id: string, dto: UpdateProductBackgroundDto, file?: Express.Multer.File) {
    const productBackground = await this.repo.findOne({
      where: { id },
      relations: ['productThemes'],
    });
    if (!productBackground) throw new NotFoundException('Product background not found');

    if (dto.productThemeIds) {
      productBackground.productThemes = await this.productThemeRepo.find({
        where: { id: In(dto.productThemeIds) },
      });
    }

    // Handle image upload if provided
    if (file) {
      // Use overwriting strategy: reuse same path if exists, otherwise create new
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = productBackground.imagePath 
        ? productBackground.imagePath // Reuse existing path (overwrite)
        : `product-backgrounds/${id}/image.${fileExtension}`; // Create new path

      // Upload as public file (will overwrite if path exists)
      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      
      productBackground.imageUrl = imageUrl;
      productBackground.imagePath = gcsPath;
    }

    productBackground.name = dto.name ?? productBackground.name;
    productBackground.description = dto.description ?? productBackground.description;

    const saved = await this.repo.save(productBackground);
    
    // Return only imageUrl (CDN URL), no base64 fallback
    return {
      ...saved,
      imageUrl: saved.imageUrl || null,
    };
  }

  async softDelete(id: string) {
    // Find the item including soft-deleted ones
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Product background not found');
    }

    // Toggle delete/restore (same behavior as flipping a boolean)
    if (entity.deletedAt) {
      await this.repo.restore(id);
    } else {
      await this.repo.softDelete(id);
    }

    // Return updated entity (same as before)
    return this.repo.findOne({ where: { id } });
  }

  async hardDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Product background not found');
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
    return { message: 'Product background permanently deleted' };
  }
}
