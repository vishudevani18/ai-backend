import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
      ? await this.productThemeRepo.findByIds(dto.productThemeIds)
      : [];

    // Generate unique ID for the entity (will be created on save)
    const tempId = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const gcsPath = `product-backgrounds/${tempId}/${uuidv4()}.${fileExtension}`;

    // Upload to GCS
    const imageUrl = await this.gcsStorageService.uploadFile(
      file.buffer,
      gcsPath,
      file.mimetype,
    );

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      imageUrl,
      productThemes,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID
    if (saved.id !== tempId) {
      const newPath = `product-backgrounds/${saved.id}/${uuidv4()}.${fileExtension}`;
      const newUrl = await this.gcsStorageService.uploadFile(file.buffer, newPath, file.mimetype);
      await this.gcsStorageService.deleteFile(gcsPath);
      saved.imageUrl = newUrl;
      return this.repo.save(saved);
    }

    return saved;
  }

  async findAll(search?: string, productThemeId?: string) {
    const where: any = {};
    if (search) where.name = ILike(`%${search}%`);

    const qb = this.repo
      .createQueryBuilder('background')
      .leftJoinAndSelect('background.productThemes', 'productTheme')
      .where('background.deleted_at IS NULL');

    if (search) qb.andWhere('background.name ILIKE :search', { search: `%${search}%` });
    if (productThemeId) qb.andWhere('productTheme.id = :productThemeId', { productThemeId });

    qb.orderBy('background.created_at', 'DESC');
    const results = await qb.getMany();
    
    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return results.map(bg => ({
      ...bg,
      imageUrl: bg.imageUrl || bg.imageBase64 || null,
    }));
  }

  async findOne(id: string) {
    const productBackground = await this.repo.findOne({
      where: { id },
      relations: ['productThemes'],
    });
    if (!productBackground) throw new NotFoundException('Product background not found');
    
    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return {
      ...productBackground,
      imageUrl: productBackground.imageUrl || productBackground.imageBase64 || null,
    };
  }

  async update(id: string, dto: UpdateProductBackgroundDto, file?: Express.Multer.File) {
    const productBackground = await this.repo.findOne({
      where: { id },
      relations: ['productThemes'],
    });
    if (!productBackground) throw new NotFoundException('Product background not found');

    if (dto.productThemeIds) {
      productBackground.productThemes = await this.productThemeRepo.findByIds(dto.productThemeIds);
    }

    // Handle image upload if provided
    if (file) {
      // Delete old image from GCS if exists
      if (productBackground.imageUrl) {
        try {
          const oldPath = this.gcsStorageService.extractPathFromUrl(productBackground.imageUrl);
          await this.gcsStorageService.deleteFile(oldPath);
        } catch (error) {
          // Log but don't fail if deletion fails
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `product-backgrounds/${id}/${uuidv4()}.${fileExtension}`;
      const imageUrl = await this.gcsStorageService.uploadFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      productBackground.imageUrl = imageUrl;
    }

    productBackground.name = dto.name ?? productBackground.name;
    productBackground.description = dto.description ?? productBackground.description;

    const saved = await this.repo.save(productBackground);
    
    // Return imageUrl if exists, fallback to imageBase64 for backward compatibility
    return {
      ...saved,
      imageUrl: saved.imageUrl || saved.imageBase64 || null,
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
}
