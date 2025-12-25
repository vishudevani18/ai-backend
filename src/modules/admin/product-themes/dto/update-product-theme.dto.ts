import { IsString, IsOptional, Length, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProductThemeDto {
  @ApiProperty({ example: 'Vintage', description: 'Product theme name' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Old-school warm product theme', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: ['uuid-of-product-type'], 
    required: false,
    description: 'Array of product type IDs. Can be sent as JSON string in multipart/form-data: ["uuid1", "uuid2"]'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        if (value.includes(',')) {
          return value.split(',').map((v: string) => v.trim());
        }
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
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
