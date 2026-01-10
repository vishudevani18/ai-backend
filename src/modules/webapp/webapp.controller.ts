import { Controller, Get, UseGuards } from '@nestjs/common';
import { WebAppService } from './webapp.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { ResponseUtil } from '../../common/utils/response.util';

@ApiTags('1. WebApp - User')
@Controller('webapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@ApiBearerAuth()
export class WebAppController {
  constructor(private readonly service: WebAppService) {}

  @Get('industries-tree')
  @ApiOperation({
    summary:
      'Get all industries with categories, product types, themes, and backgrounds (User only)',
    description:
      'Returns a nested hierarchy of industries → categories → product types → themes → background images, excluding soft-deleted records. Requires USER role authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nested data retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  getIndustriesTree() {
    return this.service.getIndustriesTree();
  }

  @Get('systemdata')
  @ApiOperation({
    summary: 'Get system data statistics (User only)',
    description:
      'Returns counts of AI Faces, Backgrounds, Poses, Categories, Industries, and Themes. Excludes soft-deleted records. Requires USER role authentication.',
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  async getSystemData() {
    const data = await this.service.getSystemData();
    return ResponseUtil.success(data, 'System data retrieved successfully');
  }

  @Get('userDashboardStatistics')
  @ApiOperation({
    summary: 'Get user dashboard statistics (User only)',
    description:
      'Returns comprehensive user dashboard statistics including: generation statistics (users with single/bulk generation, total generations), system statistics (entity counts), and general statistics (credits, payments). Requires USER role authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User dashboard statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - USER role required',
  })
  async getUserDashboardStatistics() {
    const data = await this.service.getUserDashboardStatistics();
    return ResponseUtil.success(data, 'User dashboard statistics retrieved successfully');
  }
}
