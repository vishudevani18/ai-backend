import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { AiFaceGender } from '../../../../database/entities/ai-face.entity';

export class FilterAiFacesDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Filter by category ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'Filter by gender',
    required: false,
    enum: AiFaceGender,
  })
  @IsOptional()
  @IsEnum(AiFaceGender)
  gender?: AiFaceGender;

  @ApiProperty({
    description: 'Search by AI face name (case-insensitive partial match)',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

