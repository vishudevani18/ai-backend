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

  async findAll(search?: string) {
    const where = search ? { name: ILike(`%${search}%`) } : {};

    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
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
}
