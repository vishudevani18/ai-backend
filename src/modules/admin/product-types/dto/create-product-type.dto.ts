import { IsString, IsUUID, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductTypeDto {
  @ApiProperty({ example: 'T-Shirt', description: 'Name of the product type' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Casual men’s T-shirts', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-category', description: 'Associated category ID' })
  @IsUUID()
  categoryId: string;
}
