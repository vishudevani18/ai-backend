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

    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    // Upload image if provided
    if (file) {
      // Generate temporary ID for path, will update after save
      const tempId = uuidv4();
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = `categories/${tempId}/image.${fileExtension}`;
      
      // Upload as public file
      imageUrl = await this.gcsStorageService.uploadPublicFile(file.buffer, gcsPath, file.mimetype);
      imagePath = gcsPath;
    }

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      industryId: dto.industryId,
      imageUrl,
      imagePath,
      industry,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID if different (overwrite with correct path)
    if (file && saved.id !== imagePath?.split('/')[1]) {
      const newPath = `categories/${saved.id}/image.${file.originalname.split('.').pop() || 'jpg'}`;
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
    industryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }) {
    const {
      page = 1,
      limit = 20,
      industryId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted = false,
    } = filters;

    const queryBuilder = this.repo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.industry', 'industry')
      .leftJoinAndSelect('category.productTypes', 'productTypes');

    if (includeDeleted) {
      queryBuilder.withDeleted().andWhere('category.deletedAt IS NOT NULL');
    }

    if (industryId) {
      queryBuilder.andWhere('category.industryId = :industryId', { industryId });
    }

    if (search) {
      queryBuilder.andWhere('category.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`category.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return { categories, total };
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
      // Use overwriting strategy: reuse same path if exists, otherwise create new
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const gcsPath = category.imagePath 
        ? category.imagePath // Reuse existing path (overwrite)
        : `categories/${id}/image.${fileExtension}`; // Create new path

      // Upload as public file (will overwrite if path exists)
      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );
      
      category.imageUrl = imageUrl;
      category.imagePath = gcsPath;
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

  async hardDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Category not found');
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
    return { message: 'Category permanently deleted' };
  }
}
