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

  async findAll(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = ILike(`%${search}%`);

    return this.repo.find({
      where,
      relations: ['category', 'category.industry'],
      order: { createdAt: 'DESC' },
    });
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
}
