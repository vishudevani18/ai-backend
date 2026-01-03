import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ImageGenerationService } from './image-generation.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GenerateImageResponseDto } from './dto/generate-image-response.dto';
import { GenerateBulkImageDto } from './dto/generate-bulk-image.dto';
import { GenerateBulkImageResponseDto } from './dto/generate-bulk-image-response.dto';
import { ResponseUtil } from '../../../common/utils/response.util';
import { Request } from 'express';

@ApiTags('WebApp - Image Generation')
@Controller('webapp')
export class ImageGenerationController {
  constructor(private readonly imageGenerationService: ImageGenerationService) {}

  @Public()
  @Post('generate-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate composite image using AI (Public)',
    description:
      'Generates a composite image using Google Gemini API. Accepts product catalog IDs (industry, category, product type, pose, theme, background, AI face) and a user-uploaded product image. The generated image is stored in GCS with public CDN access and automatically deleted after 6 hours. All generations are logged in the database for analytics.',
  })
  @ApiBody({ type: GenerateImageDto })
  @ApiResponse({
    status: 200,
    description: 'Image generated successfully',
    type: GenerateImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or missing reference images',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more reference IDs not found',
  })
  async generateImage(@Body() dto: GenerateImageDto) {
    const { imageUrl, expiresAt } = await this.imageGenerationService.generateImage(dto);

    const response: GenerateImageResponseDto = {
      success: true,
      imageUrl,
      message: 'Image generated successfully',
      expiresAt: expiresAt.toISOString(),
    };

    return ResponseUtil.success(response, 'Image generated successfully');
  }

  @Public()
  @Post('generate-bulk-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate multiple composite images using AI (Public)',
    description:
      'Generates multiple composite images using Google Gemini API based on multiple pose IDs. Accepts product catalog IDs (industry, category, product type, multiple poses, theme, background, AI face) and a user-uploaded product image. All images are generated in parallel to maintain the same quality as individual calls. Generated images are stored in GCS with public CDN access and automatically deleted after 6 hours. All generations are logged in the database for analytics.',
  })
  @ApiBody({ type: GenerateBulkImageDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk images generated successfully',
    type: GenerateBulkImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request, missing reference images, or all generations failed',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more reference IDs not found',
  })
  async generateBulkImage(@Body() dto: GenerateBulkImageDto, @Req() req?: Request) {
    // Extract user ID from request if available (for tracking)
    // Using type assertion since Request type doesn't include user/apiUser by default
    const request = req as any;
    const userId = request?.user?.id || request?.apiUser?.userId || undefined;

    const results = await this.imageGenerationService.generateBulkImage(dto, userId);

    const response: GenerateBulkImageResponseDto = {
      success: true,
      images: results.map(r => ({
        imageUrl: r.imageUrl,
        poseId: r.poseId,
        expiresAt: r.expiresAt.toISOString(),
      })),
      totalGenerated: results.length,
      message: `Successfully generated ${results.length} image(s)`,
    };

    return ResponseUtil.success(response, 'Bulk images generated successfully');
  }
}
