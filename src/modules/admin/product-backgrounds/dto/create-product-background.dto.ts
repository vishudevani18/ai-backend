import { IsString, IsOptional, Length, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: ['uuid-of-product-theme'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  productThemeIds?: string[];
}
