import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterProductPosesDto extends PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Filter by product type ID' })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiProperty({ required: false, description: 'Search by name (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;
}

