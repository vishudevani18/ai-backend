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
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductBackgroundsService } from './product-backgrounds.service';
import { CreateProductBackgroundDto } from './dto/create-product-background.dto';
import { UpdateProductBackgroundDto } from './dto/update-product-background.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileValidationPipe } from '../../../common/pipes/file-validation.pipe';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { FilterProductBackgroundsDto } from './dto/filter-product-backgrounds.dto';

@ApiTags('2. Admin - Product Backgrounds')
@Controller(ROUTES.ADMIN.PRODUCT_BACKGROUNDS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductBackgroundsController {
  constructor(private readonly service: ProductBackgroundsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product backgrounds with pagination, filtering, and sorting',
    description: 'Filter by productThemeId, search by name. Use includeDeleted=true to show only soft-deleted items. Sort by createdAt (default), updatedAt, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Show only soft-deleted items (default: false - shows only active items)', example: false })
  @ApiResponse({ status: 200, description: 'Product backgrounds retrieved successfully' })
  async findAll(@Query() filters: FilterProductBackgroundsDto) {
    const { backgrounds, total } = await this.service.findAll(filters);
    return ResponseUtil.paginated(
      backgrounds,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Product backgrounds retrieved successfully',
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  @ApiOperation({ summary: 'Get a product background by ID' })
  @ApiResponse({ status: 200, description: 'Product background retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return ResponseUtil.success(result, 'Product background retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product background' })
  @ApiResponse({ status: 201, description: 'Product background created successfully' })
  async create(
    @Body() dto: CreateProductBackgroundDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()] }))
    file: Express.Multer.File,
  ) {
    const result = await this.service.create(dto, file);
    return ResponseUtil.success(result, 'Product background created successfully');
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product background' })
  @ApiResponse({ status: 200, description: 'Product background updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductBackgroundDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()], fileIsRequired: false }))
    file?: Express.Multer.File,
  ) {
    const result = await this.service.update(id, dto, file);
    return ResponseUtil.success(result, 'Product background updated successfully');
  }

  @Patch(':id/soft-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle soft delete status for a product background (restores if deleted, deletes if active)' })
  @ApiResponse({ status: 200, description: 'Product background status toggled successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Product background updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete (permanently delete) a product background by ID' })
  @ApiResponse({ status: 200, description: 'Product background permanently deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product background not found' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.service.hardDelete(id);
    return ResponseUtil.success(result, 'Product background permanently deleted successfully');
  }
}
