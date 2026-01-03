import { Controller, Get } from '@nestjs/common';
import { WebAppService } from './webapp.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('WebApp - User')
@Controller('webapp')
//@UseGuards(JwtAuthGuard, RolesGuard)
//@Roles(UserRole.USER)
//@ApiBearerAuth()
export class WebAppController {
  constructor(private readonly service: WebAppService) {}

  @Get('industries-tree')
  @ApiOperation({
    summary:
      'Get all industries with categories, product types, themes, and backgrounds (User only)',
    description:
      'Returns a nested hierarchy of industries → categories → product types → themes → background images, excluding soft-deleted records. Requires USER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nested data retrieved successfully',
  })
  getIndustriesTree() {
    return this.service.getIndustriesTree();
  }

  @Public()
  @Get('systemdata')
  @ApiOperation({
    summary: 'Get system data statistics (Public)',
    description:
      'Returns counts of AI Faces, Backgrounds, Poses, Categories, Industries, and Themes. Excludes soft-deleted records. Public endpoint, no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'System data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            aiFaces: { type: 'number', example: 3 },
            backgrounds: { type: 'number', example: 10 },
            poses: { type: 'number', example: 20 },
            categories: { type: 'number', example: 2 },
            industries: { type: 'number', example: 1 },
            themes: { type: 'number', example: 5 },
          },
        },
        error: { type: 'boolean', example: false },
        message: { type: 'string', example: 'System data retrieved successfully' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
      },
    },
  })
  async getSystemData() {
    const data = await this.service.getSystemData();
    return ResponseUtil.success(data, 'System data retrieved successfully');
  }
}
