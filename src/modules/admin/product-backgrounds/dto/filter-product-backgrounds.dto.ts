import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class FilterProductBackgroundsDto extends PaginationQueryDto {
  @ApiProperty({ required: false, description: 'Search by name (partial match)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by product theme ID' })
  @IsOptional()
  @IsString()
  productThemeId?: string;
}

