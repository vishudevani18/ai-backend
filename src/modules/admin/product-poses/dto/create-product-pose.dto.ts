import { IsString, IsUUID, IsOptional, Length, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductPoseDto {
  @ApiProperty({ example: 'Look-Left', description: 'Product pose display name' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Shoulders down, head tilted left', required: false })
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

  @ApiProperty({ example: 'uuid-of-product-type', description: 'Associated product type ID' })
  @IsUUID()
  productTypeId: string;

  @ApiProperty({ 
    example: ['uuid-of-product-background'], 
    required: false, 
    description: 'Array of product background IDs. Can be sent as JSON string in multipart/form-data: ["uuid1", "uuid2"]'
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
  productBackgroundIds?: string[];
}
