import { ROUTES } from '../../../common/constants';
import { Controller, Get, Post, Body, Param, Query, Put, Patch, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ApiOperation, ApiQuery, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { FilterProductTypesDto } from './dto/filter-product-types.dto';

@ApiTags('2. Admin - Product Types')
@Controller(ROUTES.ADMIN.PRODUCT_TYPES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductTypesController {
  constructor(private readonly service: ProductTypesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product types with pagination, filtering, and sorting',
    description: 'Filter by categoryId, search by name. Use includeDeleted=true to show only soft-deleted items. Sort by createdAt (default), updatedAt, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Show only soft-deleted items (default: false - shows only active items)', example: false })
  @ApiResponse({ status: 200, description: 'Product types retrieved successfully' })
  async findAll(@Query() filters: FilterProductTypesDto) {
    const { productTypes, total } = await this.service.findAll(filters);
    return ResponseUtil.paginated(
      productTypes,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Product Types retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product type by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return ResponseUtil.success(result, 'Product Types retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product type' })
  async create(@Body() dto: CreateProductTypeDto) {
    const result = await this.service.create(dto);
    return ResponseUtil.success(result, 'Product Types created successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product type by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    const result = await this.service.update(id, dto);
    return ResponseUtil.success(result, 'Product Types updated successfully');
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Toggle soft delete status for a product type (restores if deleted, deletes if active)' })
  @ApiResponse({ status: 200, description: 'Product type status toggled successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Product Types updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete (permanently delete) a product type by ID' })
  @ApiResponse({ status: 200, description: 'Product type permanently deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product type not found' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.service.hardDelete(id);
    return ResponseUtil.success(result, 'Product type permanently deleted successfully');
  }
}
