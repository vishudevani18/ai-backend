import { Controller, Get, UseGuards } from '@nestjs/common';
import { WebAppService } from './webapp.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('WebApp - User')
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
      'Returns a nested hierarchy of industries → categories → product types → themes → background images, excluding soft-deleted records. Requires USER role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nested data retrieved successfully',
  })
  getIndustriesTree() {
    return this.service.getIndustriesTree();
  }
}
