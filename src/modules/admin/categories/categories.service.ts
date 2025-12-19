import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from '../../../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Industry } from '../../../database/entities/industry.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,

    @InjectRepository(Industry)
    private readonly industryRepo: Repository<Industry>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const industry = await this.industryRepo.findOne({
      where: { id: dto.industryId },
    });
    if (!industry) throw new NotFoundException('Industry not found');

    // Ensure category name uniqueness within the same industry
    const existing = await this.repo.findOne({
      where: { name: dto.name, industryId: dto.industryId },
    });
    if (existing) throw new BadRequestException('Category already exists in this industry');

    const tempId = uuidv4();
    let imageUrl: string | undefined;

    // Upload image if provided
    if (file) {
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `categories/${tempId}/${uuidv4()}.${fileExtension}`;
      imageUrl = await this.gcsStorageService.uploadFile(file.buffer, gcsPath, file.mimetype);
    }

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      industryId: dto.industryId,
      imageUrl,
      industry,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID if different
    if (file && saved.id !== tempId && imageUrl) {
      const newPath = `categories/${saved.id}/${uuidv4()}.${file.originalname.split('.').pop() || 'jpg'}`;
      const newUrl = await this.gcsStorageService.uploadFile(file.buffer, newPath, file.mimetype);
      await this.gcsStorageService.deleteFile(this.gcsStorageService.extractPathFromUrl(imageUrl));
      saved.imageUrl = newUrl;
      return this.repo.save(saved);
    }

    return saved;
  }

  async findAll(industryId?: string, search?: string) {
    const where: any = {};

    if (industryId) where.industryId = industryId;
    if (search) where.name = ILike(`%${search}%`);

    return this.repo.find({
      where,
      relations: ['industry', 'productTypes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['industry', 'productTypes'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['industry', 'productTypes'],
    });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.industryId) {
      const newIndustry = await this.industryRepo.findOne({
        where: { id: dto.industryId },
      });
      if (!newIndustry) throw new NotFoundException('New Industry not found');
      category.industry = newIndustry;
      category.industryId = dto.industryId;
    }

    // Handle image upload if provided
    if (file) {
      // Delete old image from GCS if exists
      if (category.imageUrl) {
        try {
          const oldPath = this.gcsStorageService.extractPathFromUrl(category.imageUrl);
          await this.gcsStorageService.deleteFile(oldPath);
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `categories/${id}/${uuidv4()}.${fileExtension}`;
      const imageUrl = await this.gcsStorageService.uploadFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      category.imageUrl = imageUrl;
    }

    category.name = dto.name ?? category.name;
    category.description = dto.description ?? category.description;

    return this.repo.save(category);
  }

  async softDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    if (entity.deletedAt) {
      await this.repo.restore(id);
    } else {
      await this.repo.softDelete(id);
    }

    return this.repo.findOne({ where: { id } });
  }
}
