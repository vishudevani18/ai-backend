import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtUser } from '../../../common/types/jwt-user.type';
import { ImageGenerationService } from './image-generation.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GenerateImageResponseDto } from './dto/generate-image-response.dto';
import { GenerateBulkImageDto } from './dto/generate-bulk-image.dto';
import { GenerateBulkImageResponseDto } from './dto/generate-bulk-image-response.dto';
import { GetMyImagesDto } from './dto/get-my-images.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('1. WebApp - Image Generation')
@Controller('webapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@ApiBearerAuth()
export class ImageGenerationController {
  constructor(private readonly imageGenerationService: ImageGenerationService) {}

  @Post('generate-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate composite image using AI (User only)',
    description:
      'Generates a composite image using Google Gemini API. Accepts product catalog IDs (industry, category, product type, pose, theme, background, AI face) and a user-uploaded product image. The generated image is stored in GCS with public CDN access and automatically deleted after 6 hours. All generations are logged in the database for analytics. Requires USER role authentication.',
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
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more reference IDs not found',
  })
  async generateImage(@CurrentUser() user: JwtUser, @Body() dto: GenerateImageDto) {
    if (!user || !user.id) {
      throw new BadRequestException('User not found in request');
    }
    const { imageUrl, expiresAt } = await this.imageGenerationService.generateImage(dto, user.id);

    const response: GenerateImageResponseDto = {
      success: true,
      imageUrl,
      message: 'Image generated successfully',
      expiresAt: expiresAt.toISOString(),
    };

    return ResponseUtil.success(response, 'Image generated successfully');
  }

  @Post('generate-bulk-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate multiple composite images using AI (User only)',
    description:
      'Generates multiple composite images using Google Gemini API based on multiple pose IDs. Accepts product catalog IDs (industry, category, product type, multiple poses, theme, background, AI face) and a user-uploaded product image. All images are generated in parallel to maintain the same quality as individual calls. Generated images are stored in GCS with public CDN access and automatically deleted after 6 hours. All generations are logged in the database for analytics. Requires USER role authentication.',
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
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more reference IDs not found',
  })
  async generateBulkImage(@CurrentUser() user: JwtUser, @Body() dto: GenerateBulkImageDto) {
    if (!user || !user.id) {
      throw new BadRequestException('User not found in request');
    }
    const results = await this.imageGenerationService.generateBulkImage(dto, user.id);

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

  @Get('my-images')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user\'s generated images with metadata (User only)',
    description:
      'Returns a paginated list of successfully generated, non-expired images by the authenticated user. Only shows images with generation status "success" that have not expired (expiresAt > current time) and have a valid imageUrl. Expired images are automatically excluded. Includes CDN URLs, expiration times, and all generation metadata (product type name, pose name, theme name, background name, AI face name, industry name, category name). Supports filtering by generation type (single/bulk). Images are sorted by creation date (newest first) by default. Requires USER role authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User images retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                  imageUrl: {
                    type: 'string',
                    nullable: true,
                    example: 'https://storage.googleapis.com/bucket/generated-images/123/image.jpg',
                  },
                  expiresAt: { type: 'string', nullable: true, example: '2024-01-15T18:00:00Z' },
                  generationStatus: { type: 'string', enum: ['success', 'failed'], example: 'success' },
                  generationType: { type: 'string', enum: ['single', 'bulk'], example: 'single' },
                  generationTimeMs: { type: 'number', nullable: true, example: 2500 },
                  createdAt: { type: 'string', example: '2024-01-15T12:00:00Z' },
                  errorMessage: { type: 'string', nullable: true, example: null },
                  industryName: { type: 'string', example: 'Fashion' },
                  categoryName: { type: 'string', example: "Women's Wear" },
                  productTypeName: { type: 'string', example: 'Kurti' },
                  productPoseName: { type: 'string', example: 'Standing Elegant' },
                  productThemeName: { type: 'string', example: 'Casual' },
                  productBackgroundName: { type: 'string', example: 'Studio White' },
                  aiFaceName: { type: 'string', example: 'Female Model 1' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 20 },
                total: { type: 'number', example: 150 },
                totalPages: { type: 'number', example: 8 },
              },
            },
          },
        },
        error: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Images retrieved successfully' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  async getMyImages(@CurrentUser() user: JwtUser, @Query() filters: GetMyImagesDto) {
    if (!user || !user.id) {
      throw new BadRequestException('User not found in request');
    }
    const { images, total } = await this.imageGenerationService.getMyGeneratedImages(
      user.id,
      filters,
    );

    return ResponseUtil.paginated(
      images,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Images retrieved successfully',
    );
  }
}
