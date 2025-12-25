import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiProperty({ required: false, default: false, description: 'Show only soft-deleted items (when true, returns only deleted items)' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;
}

