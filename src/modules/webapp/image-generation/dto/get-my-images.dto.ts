import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { GenerationType } from '../../../../database/entities/generated-image.entity';

export class GetMyImagesDto extends PaginationQueryDto {
  @ApiProperty({
    required: false,
    enum: GenerationType,
    description: 'Filter by generation type (single or bulk)',
    example: GenerationType.SINGLE,
  })
  @IsOptional()
  @IsEnum(GenerationType)
  generationType?: GenerationType;
}
