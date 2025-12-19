import { IsString, IsUUID, IsOptional, Length, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: ['uuid-of-product-background'], required: false, description: 'Associated product background IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  productBackgroundIds?: string[];
}
