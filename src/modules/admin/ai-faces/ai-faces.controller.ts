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
import { AiFacesService } from './ai-faces.service';
import { CreateAiFaceDto } from './dto/create-ai-face.dto';
import { UpdateAiFaceDto } from './dto/update-ai-face.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileValidationPipe } from '../../../common/pipes/file-validation.pipe';
import { ResponseUtil } from '@/common/utils/response.util';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { FilterAiFacesDto } from './dto/filter-ai-faces.dto';
import { AiFaceGender } from '../../../database/entities/ai-face.entity';

@ApiTags('Admin - AI Faces')
@Controller(ROUTES.ADMIN.AI_FACES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AiFacesController {
  constructor(private readonly service: AiFacesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all AI faces with pagination, filtering, and sorting',
    description: 'Filter by categoryId, gender. Search by name. Use includeDeleted=true to show only soft-deleted items. Sort by createdAt (default), updatedAt, name. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'gender', required: false, enum: AiFaceGender, description: 'Filter by gender (male/female)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by AI face name' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Show only soft-deleted items (default: false - shows only active items)', example: false })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (e.g., createdAt, name)', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order', example: 'DESC' })
  @ApiResponse({ status: 200, description: 'AI faces retrieved successfully' })
  async findAll(@Query() filters: FilterAiFacesDto) {
    const { aiFaces, total } = await this.service.findAll(filters);
    return ResponseUtil.paginated(
      aiFaces,
      filters.page || 1,
      filters.limit || 20,
      total,
      'AI faces retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an AI face by ID' })
  @ApiResponse({ status: 200, description: 'AI face retrieved successfully' })
  @ApiResponse({ status: 404, description: 'AI face not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return ResponseUtil.success(result, 'AI face retrieved successfully');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new AI face' })
  @ApiResponse({ status: 201, description: 'AI face created successfully' })
  async create(
    @Body() dto: CreateAiFaceDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()] }))
    file: Express.Multer.File,
  ) {
    const result = await this.service.create(dto, file);
    return ResponseUtil.success(result, 'AI face created successfully');
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an AI face by ID' })
  @ApiResponse({ status: 200, description: 'AI face updated successfully' })
  @ApiResponse({ status: 404, description: 'AI face not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAiFaceDto,
    @UploadedFile(new ParseFilePipe({ validators: [new FileValidationPipe()], fileIsRequired: false }))
    file?: Express.Multer.File,
  ) {
    const result = await this.service.update(id, dto, file);
    return ResponseUtil.success(result, 'AI face updated successfully');
  }

  @Patch(':id/soft-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle soft delete status for an AI face (restores if deleted, deletes if active)' })
  @ApiResponse({ status: 200, description: 'AI face status toggled successfully' })
  async softDelete(@Param('id') id: string) {
    const result = await this.service.softDelete(id);
    return ResponseUtil.success(result, 'AI face soft deleted successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hard delete (permanently delete) an AI face by ID' })
  @ApiResponse({ status: 200, description: 'AI face permanently deleted successfully' })
  @ApiResponse({ status: 404, description: 'AI face not found' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.service.hardDelete(id);
    return ResponseUtil.success(result, 'AI face permanently deleted successfully');
  }
}

