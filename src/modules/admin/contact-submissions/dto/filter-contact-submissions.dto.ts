import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ContactFormStatus } from '../../../../database/entities/contact-form.entity';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterContactSubmissionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ContactFormStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(ContactFormStatus)
  status?: ContactFormStatus;

  @ApiPropertyOptional({
    description: 'Filter by email (partial match)',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO date string)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO date string)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
