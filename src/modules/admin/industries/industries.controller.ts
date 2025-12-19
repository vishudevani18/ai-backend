import { ROUTES } from '../../../common/constants';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IndustriesService } from './industries.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';

@ApiTags('Admin - Industries')
@Controller(ROUTES.ADMIN.INDUSTRIES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class IndustriesController {
  constructor(private readonly service: IndustriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all industries' })
  @ApiResponse({ status: 200, description: 'Industries retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query('search') search?: string) {
    const result = await this.service.findAll(search);
    return ResponseUtil.success(result, 'Industries retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an industry by ID' })
  @ApiResponse({ status: 200, description: 'Industry retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    if (!result) return ResponseUtil.error(null, 'Industry not found');
    return ResponseUtil.success(result, 'Industries retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new industry' })
  @ApiResponse({ status: 201, description: 'Industry created successfully' })
  async create(@Body() dto: CreateIndustryDto) {
    const result = await this.service.create(dto);
    return ResponseUtil.success(result, 'Industry created successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an industry by ID' })
  @ApiResponse({ status: 200, description: 'Industry updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateIndustryDto) {
    const result = await this.service.update(id, dto);
    return ResponseUtil.success(result, 'Industry updated successfully');
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete an industry by ID' })
  @ApiResponse({ status: 200, description: 'Industry soft deleted successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Industry soft deleted successfully');
  }
}
