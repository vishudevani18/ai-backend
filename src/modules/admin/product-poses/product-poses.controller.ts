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

@ApiTags('Admin - Product Poses')
@Controller(ROUTES.ADMIN.PRODUCT_POSES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductPosesController {
  constructor(private readonly service: ProductPosesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product poses (filter by productTypeId or search by name)' })
  @ApiResponse({ status: 200, description: 'Product poses retrieved successfully' })
  @ApiQuery({ name: 'productTypeId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query('productTypeId') productTypeId?: string, @Query('search') search?: string) {
    const result = await this.service.findAll(productTypeId, search);
    return ResponseUtil.success(result, 'Product pose retrieved successfully');
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
}
