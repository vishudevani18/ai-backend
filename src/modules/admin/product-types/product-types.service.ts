import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductType } from '../../../database/entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { Category } from '../../../database/entities/category.entity';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(ProductType)
    private readonly repo: Repository<ProductType>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateProductTypeDto) {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
      relations: ['industry'],
    });
    if (!category) throw new NotFoundException('Category not found');

    const exists = await this.repo.findOne({
      where: { name: dto.name, categoryId: dto.categoryId },
    });
    if (exists) throw new BadRequestException('Product type already exists for this category');

    const entity = this.repo.create({ ...dto, category });
    return this.repo.save(entity);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.repo
      .createQueryBuilder('productType')
      .leftJoinAndSelect('productType.category', 'category')
      .leftJoinAndSelect('category.industry', 'industry');

    if (categoryId) {
      queryBuilder.andWhere('productType.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere('productType.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`productType.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [productTypes, total] = await queryBuilder.getManyAndCount();

    return { productTypes, total };
  }

  async findOne(id: string) {
    const pt = await this.repo.findOne({
      where: { id },
      relations: ['category', 'category.industry'],
    });
    if (!pt) throw new NotFoundException('Product type not found');
    return pt;
  }

  async update(id: string, dto: UpdateProductTypeDto) {
    const productType = await this.findOne(id);

    if (dto.categoryId) {
      const newCategory = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!newCategory) throw new NotFoundException('New category not found');
      productType.category = newCategory;
    }

    Object.assign(productType, dto);
    return this.repo.save(productType);
  }

  async softDelete(id: string) {
    // Fetch including soft-deleted product types
    const pt = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!pt) {
      throw new NotFoundException('Product type not found');
    }

    // Toggle soft delete / restore
    if (pt.deletedAt) {
      await this.repo.restore(id);
    } else {
      await this.repo.softDelete(id);
    }

    // Return updated product type just like before
    return this.repo.findOne({ where: { id } });
  }

  async hardDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Product type not found');
    }

    // Hard delete (permanent removal)
    await this.repo.remove(entity);
    return { message: 'Product type permanently deleted' };
  }
}
