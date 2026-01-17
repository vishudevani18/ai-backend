import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { CreateAiFaceDto } from './dto/create-ai-face.dto';
import { UpdateAiFaceDto } from './dto/update-ai-face.dto';
import { Category } from '../../../database/entities/category.entity';
import { GcsStorageService } from '../../../storage/services/gcs-storage.service';
import { v4 as uuidv4 } from 'uuid';
import { FilterAiFacesDto } from './dto/filter-ai-faces.dto';

@Injectable()
export class AiFacesService {
  constructor(
    @InjectRepository(AiFace)
    private readonly repo: Repository<AiFace>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  async create(dto: CreateAiFaceDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image file is required');

    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    // Check if name already exists for this category and gender
    const exists = await this.repo.findOne({
      where: { name: dto.name, categoryId: dto.categoryId, gender: dto.gender },
    });
    if (exists) {
      throw new BadRequestException(
        'AI face with this name already exists for this category and gender',
      );
    }

    // Generate temporary ID for path, will update after save
    const tempId = uuidv4();
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const gcsPath = `ai-faces/${dto.categoryId}/${dto.gender}/${tempId}/image.${fileExtension}`;

    // Upload as public file
    const imageUrl = await this.gcsStorageService.uploadPublicFile(
      file.buffer,
      gcsPath,
      file.mimetype,
    );

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description,
      gender: dto.gender,
      categoryId: dto.categoryId,
      imageUrl,
      imagePath: gcsPath,
      category,
    });

    const saved = await this.repo.save(entity);

    // Update GCS path with actual ID if different (overwrite with correct path)
    if (saved.id !== tempId) {
      const newPath = `ai-faces/${dto.categoryId}/${dto.gender}/${saved.id}/image.${fileExtension}`;
      const newUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        newPath,
        file.mimetype,
      );

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

  async findAll(filters: FilterAiFacesDto) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      gender,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeDeleted = false,
    } = filters;

    const queryBuilder = this.repo
      .createQueryBuilder('aiFace')
      .leftJoinAndSelect('aiFace.category', 'category')
      .leftJoinAndSelect('category.industry', 'industry');

    if (includeDeleted) {
      queryBuilder.withDeleted().andWhere('aiFace.deletedAt IS NOT NULL');
    }

    if (categoryId) {
      queryBuilder.andWhere('aiFace.categoryId = :categoryId', { categoryId });
    }

    if (gender) {
      queryBuilder.andWhere('aiFace.gender = :gender', { gender });
    }

    if (search) {
      queryBuilder.andWhere('aiFace.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`aiFace.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [aiFaces, total] = await queryBuilder.getManyAndCount();

    return { aiFaces, total };
  }

  async findOne(id: string) {
    const aiFace = await this.repo.findOne({
      where: { id },
      relations: ['category', 'category.industry'],
    });
    if (!aiFace) throw new NotFoundException('AI face not found');
    return aiFace;
  }

  async update(id: string, dto: UpdateAiFaceDto, file?: Express.Multer.File) {
    const aiFace = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!aiFace) throw new NotFoundException('AI face not found');

    // Check if category changed
    if (dto.categoryId && dto.categoryId !== aiFace.categoryId) {
      const newCategory = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!newCategory) throw new NotFoundException('New category not found');
      aiFace.category = newCategory;
      aiFace.categoryId = dto.categoryId;
    }

    // Check if name/gender combination already exists (excluding current)
    if (dto.name || dto.gender) {
      const checkName = dto.name ?? aiFace.name;
      const checkGender = dto.gender ?? aiFace.gender;
      const checkCategoryId = dto.categoryId ?? aiFace.categoryId;

      const duplicate = await this.repo.findOne({
        where: {
          name: checkName,
          categoryId: checkCategoryId,
          gender: checkGender,
        },
      });
      if (duplicate && duplicate.id !== aiFace.id) {
        throw new BadRequestException(
          'AI face with this name already exists for this category and gender',
        );
      }
    }

    // Handle image upload if provided
    if (file) {
      // Use overwriting strategy: reuse same path if exists, otherwise create new
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const finalGender = dto.gender ?? aiFace.gender;
      const finalCategoryId = dto.categoryId ?? aiFace.categoryId;
      const gcsPath =
        aiFace.imagePath && aiFace.categoryId === finalCategoryId && aiFace.gender === finalGender
          ? aiFace.imagePath // Reuse existing path (overwrite) if category and gender unchanged
          : `ai-faces/${finalCategoryId}/${finalGender}/${id}/image.${fileExtension}`; // Create new path

      // Upload as public file (will overwrite if path exists)
      const imageUrl = await this.gcsStorageService.uploadPublicFile(
        file.buffer,
        gcsPath,
        file.mimetype,
      );

      aiFace.imageUrl = imageUrl;
      aiFace.imagePath = gcsPath;
    }

    aiFace.name = dto.name ?? aiFace.name;
    aiFace.description = dto.description ?? aiFace.description;
    aiFace.gender = dto.gender ?? aiFace.gender;

    return this.repo.save(aiFace);
  }

  async softDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('AI face not found');
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
      throw new NotFoundException('AI face not found');
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
    return { message: 'AI face permanently deleted' };
  }
}
