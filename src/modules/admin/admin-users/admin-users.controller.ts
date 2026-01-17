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
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../database/entities/user.entity';
import { ResponseUtil } from '../../../common/utils/response.util';
import { FilterAdminUsersDto } from './dto/filter-admin-users.dto';

@ApiTags('2. Admin - Admin Users Management')
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
  @ApiOperation({
    summary: 'Get all admin users with pagination, filtering, and sorting (Super Admin only)',
    description:
      'Filter by email, phone, status. Sort by createdAt (default), updatedAt, email, firstName, lastName. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiResponse({ status: 200, description: 'Admins retrieved successfully' })
  async findAll(@Query() filters: FilterAdminUsersDto) {
    const { admins, total } = await this.adminUsersService.findAll(filters);
    return ResponseUtil.paginated(
      admins,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Admins retrieved successfully',
    );
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
  @ApiOperation({
    summary:
      'Toggle admin user active/inactive status (Super Admin only). Switches between ACTIVE and INACTIVE status. Cannot deactivate yourself.',
  })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @ApiResponse({
    status: 200,
    description: 'Admin status toggled successfully. Returns updated admin with new status.',
  })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Cannot deactivate yourself' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Only super admin can toggle admin status',
  })
  async toggleActive(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const admin = await this.adminUsersService.toggleActive(id, currentUser.id);
    return ResponseUtil.success(admin, 'Admin status toggled successfully');
  }
}
