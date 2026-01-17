import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactForm, ContactFormStatus } from '../../../database/entities/contact-form.entity';
import { FilterContactSubmissionsDto } from './dto/filter-contact-submissions.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ContactSubmissionsService {
  constructor(
    @InjectRepository(ContactForm)
    private readonly contactFormRepository: Repository<ContactForm>,
  ) {}

  async findAll(
    filters: FilterContactSubmissionsDto,
  ): Promise<{ submissions: ContactForm[]; total: number }> {
    const { page = 1, limit = 20, status, email, startDate, endDate, sortBy, sortOrder } = filters;

    const queryBuilder = this.contactFormRepository
      .createQueryBuilder('cf')
      .select([
        'cf.id',
        'cf.name',
        'cf.email',
        'cf.phone',
        'cf.subject',
        'cf.message',
        'cf.status',
        'cf.readAt',
        'cf.readBy',
        'cf.ipAddress',
        'cf.userAgent',
        'cf.createdAt',
        'cf.updatedAt',
      ]);

    // Apply filters
    if (status) {
      queryBuilder.andWhere('cf.status = :status', { status });
    }

    if (email) {
      queryBuilder.andWhere('cf.email ILIKE :email', { email: `%${email}%` });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('cf.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('cf.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('cf.createdAt <= :endDate', { endDate });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'email', 'name'];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder || 'DESC';
    queryBuilder.orderBy(`cf.${sortField}`, order);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [submissions, total] = await queryBuilder.getManyAndCount();

    return { submissions, total };
  }

  async findOne(id: string): Promise<ContactForm> {
    const submission = await this.contactFormRepository.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'subject',
        'message',
        'status',
        'readAt',
        'readBy',
        'ipAddress',
        'userAgent',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!submission) {
      throw new NotFoundException('Contact submission not found');
    }

    return submission;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, adminId: string): Promise<ContactForm> {
    const submission = await this.contactFormRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Contact submission not found');
    }

    submission.status = dto.status;

    // If marking as read and not already read, set readAt and readBy
    if (dto.status === ContactFormStatus.READ && !submission.readAt) {
      submission.readAt = new Date();
      submission.readBy = adminId;
    }

    // If changing from READ to another status, clear readAt and readBy
    if (dto.status !== ContactFormStatus.READ && submission.status === ContactFormStatus.READ) {
      submission.readAt = null;
      submission.readBy = null;
    }

    return await this.contactFormRepository.save(submission);
  }

  async remove(id: string): Promise<void> {
    const submission = await this.contactFormRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Contact submission not found');
    }

    // Soft delete
    await this.contactFormRepository.softDelete(id);
  }
}
