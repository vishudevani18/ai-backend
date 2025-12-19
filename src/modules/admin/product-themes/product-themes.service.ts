import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
      ? await this.productTypeRepo.findByIds(dto.productTypeIds)
      : [];

    const tempId = uuidv4();
    let imageUrl: string | undefined;

    // Upload image if provided
    if (file) {
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `themes/${tempId}/${uuidv4()}.${fileExtension}`;
      imageUrl = await this.gcsStorageService.uploadFile(file.buffer, gcsPath, file.mimetype);
    }

    const productTheme = this.repo.create({
      name: dto.name,
      description: dto.description,
      imageUrl,
      productTypes,
    });

    const saved = await this.repo.save(productTheme);

    // Update GCS path with actual ID if different
    if (file && saved.id !== tempId && imageUrl) {
      const newPath = `themes/${saved.id}/${uuidv4()}.${file.originalname.split('.').pop() || 'jpg'}`;
      const newUrl = await this.gcsStorageService.uploadFile(file.buffer, newPath, file.mimetype);
      await this.gcsStorageService.deleteFile(this.gcsStorageService.extractPathFromUrl(imageUrl));
      saved.imageUrl = newUrl;
      return this.repo.save(saved);
    }

    return saved;
  }

  async findAll(search?: string) {
    const where: Record<string, unknown> = {};
    if (search) where.name = ILike(`%${search}%`);

    return this.repo.find({
      where,
      relations: ['productTypes', 'productBackgrounds'],
      order: { createdAt: 'DESC' },
    });
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
      productTheme.productTypes = await this.productTypeRepo.findByIds(dto.productTypeIds);
    }

    // Handle image upload if provided
    if (file) {
      // Delete old image from GCS if exists
      if (productTheme.imageUrl) {
        try {
          const oldPath = this.gcsStorageService.extractPathFromUrl(productTheme.imageUrl);
          await this.gcsStorageService.deleteFile(oldPath);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `themes/${id}/${uuidv4()}.${fileExtension}`;
      const imageUrl = await this.gcsStorageService.uploadFile(file.buffer, gcsPath, file.mimetype);
      productTheme.imageUrl = imageUrl;
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
}
