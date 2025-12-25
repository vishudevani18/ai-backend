import { IsString, IsOptional, Length, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductBackgroundDto {
  @ApiProperty({ example: 'Forest Landscape', description: 'Name of the product background' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'A high-quality forest image for outdoor-themed product backgrounds',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPEG, PNG, WebP, GIF)',
    required: true,
  })
  image: any; // File will be handled by FileInterceptor

  @ApiProperty({ 
    example: ['uuid-of-product-theme'], 
    required: false,
    description: 'Array of product theme IDs. Can be sent as JSON string in multipart/form-data: ["uuid1", "uuid2"]'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // If not valid JSON, treat as single value or comma-separated
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
  productThemeIds?: string[];
}
