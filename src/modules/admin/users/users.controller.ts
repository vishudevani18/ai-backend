import { ROUTES } from '../../../common/constants';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../database/entities/user.entity';
import { AdminUsersService } from './users.service';
import { AuthService } from '../../auth/auth.service';
import { ResponseUtil } from '../../../common/utils/response.util';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('2. Admin - User Management')
@Controller(ROUTES.ADMIN.USERS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user (Admin/Super Admin only)',
    description:
      'Creates a user directly without OTP verification. Phone and email are automatically marked as verified. User receives default signup credits.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User with this email or phone already exists' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.authService.createUserByAdmin(dto);
    return ResponseUtil.success(user, 'User created successfully');
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all regular users with pagination, filtering, and sorting (Admin/Super Admin only)',
    description:
      'Filter by email, phone, status. Returns lastLogin, emailVerified, and profileImage fields. Sort by createdAt (default), updatedAt, email, firstName, lastName. Default: 20 items per page, sorted by createdAt DESC',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() filters: FilterUsersDto) {
    const { users, total } = await this.adminUsersService.findAll(filters);
    return ResponseUtil.paginated(
      users,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin/Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description:
      'User retrieved successfully. Includes lastLogin, emailVerified, and profileImage fields.',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.adminUsersService.findOne(id);
    return ResponseUtil.success(user, 'User retrieved successfully');
  }

  @Patch(':id/toggle-active')
  @ApiOperation({
    summary:
      'Toggle user active/inactive status (Admin/Super Admin only). Switches between ACTIVE and INACTIVE status.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User status toggled successfully. Returns updated user with new status.',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Only admins can toggle user status' })
  async toggleActive(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const user = await this.adminUsersService.toggleActive(id, currentUser.id);
    return ResponseUtil.success(user, 'User status toggled successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin/Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.adminUsersService.remove(id, currentUser.id);
    return ResponseUtil.success(null, 'User deleted successfully');
  }
}
