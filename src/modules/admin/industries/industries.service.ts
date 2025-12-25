import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Industry } from '../../../database/entities/industry.entity';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@Injectable()
export class IndustriesService {
  constructor(
    @InjectRepository(Industry)
    private readonly repo: Repository<Industry>,
  ) {}

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

    const queryBuilder = this.repo.createQueryBuilder('industry');

    if (includeDeleted) {
      queryBuilder.withDeleted().andWhere('industry.deletedAt IS NOT NULL');
    }

    if (search) {
      queryBuilder.andWhere('industry.name ILIKE :search', { search: `%${search}%` });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`industry.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [industries, total] = await queryBuilder.getManyAndCount();

    return { industries, total };
  }

  async findOne(id: string) {
    const industry = await this.repo.findOne({ where: { id } });
    return industry;
  }

  async create(dto: CreateIndustryDto) {
    const industry = this.repo.create(dto);
    return this.repo.save(industry);
  }

  async update(id: string, dto: UpdateIndustryDto) {
    const industry = await this.findOne(id);
    Object.assign(industry, dto);
    return this.repo.save(industry);
  }

  async softDelete(id: string) {
    // Fetch entity including deleted ones
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Industry not found');
    }

    // Toggle delete/restore (just like boolean flip)
    if (entity.deletedAt) {
      await this.repo.restore(id);
    } else {
      await this.repo.softDelete(id);
    }
    // Load updated entity to return (same as your old code did)
    return this.repo.findOne({ where: { id } });
  }

  async hardDelete(id: string) {
    const entity = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!entity) {
      throw new NotFoundException('Industry not found');
    }

    // Hard delete (permanent removal)
    await this.repo.remove(entity);
    return { message: 'Industry permanently deleted' };
  }
}
