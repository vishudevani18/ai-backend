import { ApiProperty } from '@nestjs/swagger';

export class BulkImageItemDto {
  @ApiProperty({ description: 'GCS CDN URL of the generated image', example: 'https://storage.googleapis.com/bucket/generated-images/123/image.jpg' })
  imageUrl: string;

  @ApiProperty({ description: 'Product Pose ID used for this image', example: '123e4567-e89b-12d3-a456-426614174003' })
  poseId: string;

  @ApiProperty({ description: 'ISO timestamp when image will be deleted from GCS', example: '2024-01-15T12:00:00Z' })
  expiresAt: string;
}

export class GenerateBulkImageResponseDto {
  @ApiProperty({ description: 'Whether the generation was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Array of generated images with their details', type: [BulkImageItemDto] })
  images: BulkImageItemDto[];

  @ApiProperty({ description: 'Total number of images generated', example: 4 })
  totalGenerated: number;

  @ApiProperty({ description: 'Response message', example: 'Bulk images generated successfully' })
  message: string;
}

