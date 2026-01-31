import { ApiProperty } from '@nestjs/swagger';
import { GenerationStatus, GenerationType } from '../../../../database/entities/generated-image.entity';

export class MyImageItemDto {
  @ApiProperty({ description: 'Generated image ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({
    description: 'GCS CDN URL of the generated image. Always present for non-expired images returned by this endpoint.',
    example: 'https://storage.googleapis.com/bucket/generated-images/123/image.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'ISO timestamp when image will be deleted from GCS',
    example: '2024-01-15T18:00:00Z',
    nullable: true,
  })
  expiresAt: string | null;

  @ApiProperty({
    description: 'Generation status',
    enum: GenerationStatus,
    example: GenerationStatus.SUCCESS,
  })
  generationStatus: GenerationStatus;

  @ApiProperty({
    description: 'Generation type',
    enum: GenerationType,
    example: GenerationType.SINGLE,
  })
  generationType: GenerationType;

  @ApiProperty({
    description: 'Generation time in milliseconds',
    example: 2500,
    nullable: true,
  })
  generationTimeMs: number | null;

  @ApiProperty({
    description: 'ISO timestamp when image was created',
    example: '2024-01-15T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Error message if generation failed. Always null for success images (which are the only ones returned).',
    example: null,
    nullable: true,
  })
  errorMessage: string | null;

  @ApiProperty({ description: 'Industry name', example: 'Fashion' })
  industryName: string;

  @ApiProperty({ description: 'Category name', example: "Women's Wear" })
  categoryName: string;

  @ApiProperty({ description: 'Product type name', example: 'Kurti' })
  productTypeName: string;

  @ApiProperty({ description: 'Product pose name', example: 'Standing Elegant' })
  productPoseName: string;

  @ApiProperty({ description: 'Product theme name', example: 'Casual' })
  productThemeName: string;

  @ApiProperty({ description: 'Product background name', example: 'Studio White' })
  productBackgroundName: string;

  @ApiProperty({ description: 'AI face name', example: 'Female Model 1' })
  aiFaceName: string;
}
