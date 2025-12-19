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

@ApiTags('Admin - Product Backgrounds')
@Controller(ROUTES.ADMIN.PRODUCT_BACKGROUNDS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class ProductBackgroundsController {
  constructor(private readonly service: ProductBackgroundsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all product backgrounds (optionally filter by product theme or search)',
  })
  @ApiResponse({ status: 200, description: 'Product backgrounds retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productThemeId', required: false, type: String })
  async findAll(
    @Query('search') search?: string,
    @Query('productThemeId') productThemeId?: string,
  ) {
    const result = await this.service.findAll(search, productThemeId);
    return ResponseUtil.success(result, 'Product backgrounds retrieved successfully');
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
  @ApiOperation({ summary: 'Soft delete a product background' })
  @ApiResponse({ status: 200, description: 'Product background soft deleted successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'Product background updated successfully');
  }
}
