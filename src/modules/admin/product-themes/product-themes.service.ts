import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { ProductTheme } from '../../../database/entities/product-theme.entity';
import { CreateProductThemeDto } from './dto/create-product-theme.dto';
import { UpdateProductThemeDto } from './dto/update-product-theme.dto';
import { ProductType } from '../../../database/entities/product-type.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductThemesService {
  constructor(
    @InjectRepository(ProductTheme)
    private readonly repo: Repository<ProductTheme>,
    @InjectRepository(ProductType)
    private readonly productTypeRepo: Repository<ProductType>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async create(dto: CreateProductThemeDto, file?: Express.Multer.File): Promise<ProductTheme> {
    const productTypes = dto.productTypeIds
      ? await this.productTypeRepo.find({
          where: { id: In(dto.productTypeIds) },
        })
      : [];

    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    // Upload image if provided
    if (file) {
      // Generate temporary ID for path, will update after save
      const tempId = uuidv4();
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `product-themes/${tempId}/image.${fileExtension}`;
      
      // Upload as public file
      imageUrl = await this.gcsStorageService.uploadPublicFile(file.buffer, gcsPath, file.mimetype);
      imagePath = gcsPath;
    }

    const productTheme = this.repo.create({
      name: dto.name,
      description: dto.description,
      imageUrl,
      imagePath,
      productTypes,
    });

    const saved = await this.repo.save(productTheme);

    // Update GCS path with actual ID if different (overwrite with correct path)
    if (file && saved.id !== imagePath?.split('/')[1]) {
      const newPath = `product-themes/${saved.id}/image.${file.originalname.split('.').pop() || 'jpg'}`;
      const newUrl = await this.gcsStorageService.uploadPublicFile(file.buffer, newPath, file.mimetype);
      
      // Delete old file if path changed
      if (imagePath && imagePath !== newPath) {
        try {
          await this.gcsStorageService.deleteFile(imagePath);
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
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted = false,
    } = filters;

    const queryBuilder = this.repo
      .createQueryBuilder('theme')
      .leftJoinAndSelect('theme.productTypes', 'productTypes')
      .leftJoinAndSelect('theme.productBackgrounds', 'productBackgrounds');

    if (includeDeleted) {
      queryBuilder.withDeleted().andWhere('theme.deletedAt IS NOT NULL');
    }

    if (search) {
      queryBuilder.andWhere('theme.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`theme.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [themes, total] = await queryBuilder.getManyAndCount();

    return { themes, total };
  }

  async findOne(id: string) {
    const productTheme = await this.repo.findOne({
      where: { id },
      relations: ['productTypes', 'productBackgrounds'],
    });
    if (!productTheme) throw new NotFoundException('Product theme not found');
    return productTheme;
  }

  async update(id: string, dto: UpdateProductThemeDto, file?: Express.Multer.File) {
    const productTheme = await this.repo.findOne({
      where: { id },
      relations: ['productTypes', 'productBackgrounds'],
    });
    if (!productTheme) throw new NotFoundException('Product theme not found');

    if (dto.productTypeIds) {
      productTheme.productTypes = await this.productTypeRepo.find({
        where: { id: In(dto.productTypeIds) },
      });
    }

    // Handle image upload if provided
    if (file) {
      // Use overwriting strategy: reuse same path if exists, otherwise create new
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = productTheme.imagePath 
        ? productTheme.imagePath // Reuse existing path (overwrite)
        : `product-themes/${id}/image.${fileExtension}`; // Create new path

      // Upload as public file (will overwrite if path exists)
      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      
      productTheme.imageUrl = imageUrl;
      productTheme.imagePath = gcsPath;
    }

    productTheme.name = dto.name ?? productTheme.name;
    productTheme.description = dto.description ?? productTheme.description;

    return this.repo.save(productTheme);
  }

  async softDelete(id: string) {
    // Load including soft-deleted themes
    const theme = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!theme) {
      throw new NotFoundException('Product theme not found');
    }

    // Toggle soft-delete and restore
    if (theme.deletedAt) {
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
      throw new NotFoundException('Product theme not found');
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
    return { message: 'Product theme permanently deleted' };
  }
}
