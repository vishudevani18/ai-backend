import { IsString, IsOptional, Length, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductThemeDto {
  @ApiProperty({ example: 'Vintage', description: 'Product theme name' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Old-school warm product theme', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['uuid-of-product-type'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  productTypeIds?: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPEG, PNG, WebP, GIF)',
    required: false,
  })
  image?: any; // File will be handled by FileInterceptor
}
