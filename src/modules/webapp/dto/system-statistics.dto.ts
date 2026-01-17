import { ApiProperty } from '@nestjs/swagger';

export class GenerationsStatisticsDto {
  @ApiProperty({ description: 'Total number of image generations' })
  totalImageGenerations: number;

  @ApiProperty({
    description:
      'Number of times single generation was used (same as number of images, since each single generation = 1 image)',
  })
  singleGenerations: number;

  @ApiProperty({
    description:
      'Number of times bulk/catalog generation was used (number of bulk generation requests)',
  })
  bulkGenerationRequests: number;

  @ApiProperty({
    description:
      'Number of images generated via bulk/catalog generation (total images from all bulk requests)',
  })
  bulkGenerations: number;
}

export class GeneralStatisticsDto {
  @ApiProperty({ description: 'Total credits in the system (distributed)' })
  totalCredits: number;

  @ApiProperty({ description: 'Total remaining credits across all users' })
  remainingCredits: number;

  @ApiProperty({ description: 'Total credits used by all users' })
  usedCredits: number;

  @ApiProperty({
    description:
      'Total credits purchased for image generation (dummy value until payment integration)',
  })
  totalGeneratedImagePurchasedCredit: number;

  @ApiProperty({
    description: 'Total paid amount in the system (dummy value until payment integration)',
  })
  totalPaidAmount: number;
}

export class SystemStatisticsResponseDto {
  @ApiProperty({ description: 'Generation statistics', type: GenerationsStatisticsDto })
  generations: GenerationsStatisticsDto;

  @ApiProperty({ description: 'System statistics (entity counts)' })
  system: {
    aiFaces: number;
    backgrounds: number;
    poses: number;
    categories: number;
    industries: number;
    themes: number;
  };

  @ApiProperty({
    description: 'General statistics (credits, payments)',
    type: GeneralStatisticsDto,
  })
  general: GeneralStatisticsDto;
}
