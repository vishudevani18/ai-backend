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
import { ProductPosesService } from './product-poses.service';
import { CreateProductPoseDto } from './dto/create-product-pose.dto';
import { UpdateProductPoseDto } from './dto/update-product-pose.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileValidationPipe } from '../../../common/pipes/file-validation.pipe';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { FilterProductPosesDto } from './dto/filter-product-poses.dto';

@ApiTags('Admin - Product Poses')
@Controller(ROUTES.ADMIN.PRODUCT_POSES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductPosesController {
  constructor(private readonly service: ProductPosesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product poses with pagination, filtering, and sorting',
    description: 'Filter by productTypeId, search by name. Sort by createdAt (default), updatedAt, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiResponse({ status: 200, description: 'Product poses retrieved successfully' })
  async findAll(@Query() filters: FilterProductPosesDto) {
    const { poses, total } = await this.service.findAll(filters);
    return ResponseUtil.paginated(
      poses,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Product poses retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product pose by ID' })
  @ApiResponse({ status: 200, description: 'Product pose retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return ResponseUtil.success(result, 'Product pose retrieved successfully');
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new product pose' })
  @ApiResponse({ status: 201, description: 'Product pose created successfully' })
  async create(
    @Body() dto: CreateProductPoseDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()] }))
    file: Express.Multer.File,
  ) {
    const result = await this.service.create(dto, file);
    return ResponseUtil.success(result, 'Product pose created successfully');
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product pose by ID' })
  @ApiResponse({ status: 200, description: 'Product pose updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductPoseDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()], fileIsRequired: false }))
    file?: Express.Multer.File,
  ) {
    const result = await this.service.update(id, dto, file);
    return ResponseUtil.success(result, 'Product pose updated successfully');
  }

  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a product pose by ID' })
  @ApiResponse({ status: 200, description: 'Product pose soft deleted successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Product pose updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete (permanently delete) a product pose by ID' })
  @ApiResponse({ status: 200, description: 'Product pose permanently deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product pose not found' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.service.hardDelete(id);
    return ResponseUtil.success(result, 'Product pose permanently deleted successfully');
  }
}
