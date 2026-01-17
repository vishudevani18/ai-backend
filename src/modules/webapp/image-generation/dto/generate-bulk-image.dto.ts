import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';

export class GenerateBulkImageDto {
  @ApiProperty({ description: 'Industry ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  industryId: string;

  @ApiProperty({ description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Product Type ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsString()
  @IsNotEmpty()
  productTypeId: string;

  @ApiProperty({
    description: 'Array of Product Pose IDs',
    example: ['123e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174004'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one pose ID is required' })
  @ArrayMaxSize(20, { message: 'Maximum 20 pose IDs allowed' })
  @IsUUID('all', { each: true, message: 'Each pose ID must be a valid UUID' })
  productPoseIds: string[];

  @ApiProperty({ description: 'Product Theme ID', example: '123e4567-e89b-12d3-a456-426614174004' })
  @IsString()
  @IsNotEmpty()
  productThemeId: string;

  @ApiProperty({
    description: 'Product Background ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @IsString()
  @IsNotEmpty()
  productBackgroundId: string;

  @ApiProperty({ description: 'AI Face ID', example: '123e4567-e89b-12d3-a456-426614174006' })
  @IsString()
  @IsNotEmpty()
  aiFaceId: string;

  @ApiProperty({
    description: 'Base64 encoded product image',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  productImage: string; // Base64 encoded image

  @ApiProperty({
    description: 'MIME type of the product image',
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
  })
  @IsString()
  @IsNotEmpty()
  productImageMimeType: string; // e.g., 'image/jpeg'
}
