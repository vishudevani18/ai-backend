import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterProductTypesDto extends PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Search by name (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;
}

