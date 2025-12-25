import { ROUTES } from '../../../common/constants';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductThemesService } from './product-themes.service';
import { CreateProductThemeDto } from './dto/create-product-theme.dto';
import { UpdateProductThemeDto } from './dto/update-product-theme.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileValidationPipe } from '../../../common/pipes/file-validation.pipe';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { FilterProductThemesDto } from './dto/filter-product-themes.dto';

@ApiTags('Admin - Product Themes')
@Controller(ROUTES.ADMIN.PRODUCT_THEMES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductThemesController {
  constructor(private readonly service: ProductThemesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product themes with pagination, filtering, and sorting',
    description: 'Search by name. Sort by createdAt (default), updatedAt, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  async findAll(@Query() filters: FilterProductThemesDto) {
    const { themes, total } = await this.service.findAll(filters);
    return ResponseUtil.paginated(
      themes,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Product themes retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product theme by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return ResponseUtil.success(result, 'Product themes retry successfully');
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product theme' })
  async create(
    @Body() dto: CreateProductThemeDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()], fileIsRequired: false }))
    file?: Express.Multer.File,
  ) {
    const result = await this.service.create(dto, file);
    return ResponseUtil.success(result, 'Product themes created successfully');
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update product theme by ID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductThemeDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()], fileIsRequired: false }))
    file?: Express.Multer.File,
  ) {
    const result = await this.service.update(id, dto, file);
    return ResponseUtil.success(result, 'Product themes updated successfully');
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete product theme by ID' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Product themes updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete (permanently delete) a product theme by ID' })
  @ApiResponse({ status: 200, description: 'Product theme permanently deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product theme not found' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.service.hardDelete(id);
    return ResponseUtil.success(result, 'Product theme permanently deleted successfully');
  }
}
