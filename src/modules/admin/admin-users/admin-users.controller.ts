import { ROUTES } from '../../../common/constants';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../database/entities/user.entity';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('Admin - Admin Users Management')
@Controller(ROUTES.ADMIN.ADMIN_USERS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new admin user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Only super admin can create admins' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async create(@Body() createAdminDto: CreateAdminDto, @CurrentUser() currentUser: User) {
    const admin = await this.adminUsersService.create(createAdminDto, currentUser.id);
    return ResponseUtil.success(admin, 'Admin created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all admin users (Super Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Admins retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const { admins, total } = await this.adminUsersService.findAll(page, limit);
    return ResponseUtil.paginated(admins, page, limit, total, 'Admins retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin user by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async findOne(@Param('id') id: string) {
    const admin = await this.adminUsersService.findOne(id);
    return ResponseUtil.success(admin, 'Admin retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update admin user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @CurrentUser() currentUser: User,
  ) {
    const admin = await this.adminUsersService.update(id, updateAdminDto, currentUser.id);
    return ResponseUtil.success(admin, 'Admin updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete yourself' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.adminUsersService.remove(id, currentUser.id);
    return ResponseUtil.success(null, 'Admin deleted successfully');
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle admin user active status (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({ status: 200, description: 'Admin status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Cannot deactivate yourself' })
  async toggleActive(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const admin = await this.adminUsersService.toggleActive(id, currentUser.id);
    return ResponseUtil.success(admin, 'Admin status toggled successfully');
  }
}
