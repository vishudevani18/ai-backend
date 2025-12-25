import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterCategoriesDto extends PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Filter by industry ID' })
  @IsOptional()
  @IsString()
  industryId?: string;

  @ApiProperty({ required: false, description: 'Search by name (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;
}

