import { Controller, Get, Patch, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtUser } from '../../../common/types/jwt-user.type';
import { WebAppProfileService } from './profile.service';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('WebApp - User Profile')
@Controller('webapp/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER)
@ApiBearerAuth()
export class WebAppProfileController {
  constructor(private readonly profileService: WebAppProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile (User only)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getProfile(@CurrentUser() user: JwtUser) {
    if (!user || !user.id) {
      throw new Error('User not found in request');
    }
    const profile = await this.profileService.getProfile(user.id);
    return ResponseUtil.success(profile, 'Profile retrieved successfully');
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile (User only)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@CurrentUser() user: JwtUser, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.profileService.updateProfile(user.id, updateUserDto);
    return ResponseUtil.success(updatedUser, 'Profile updated successfully');
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change current user password (User only)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(@CurrentUser() user: JwtUser, @Body() changePasswordDto: ChangePasswordDto) {
    await this.profileService.changePassword(user.id, changePasswordDto);
    return ResponseUtil.success(null, 'Password changed successfully');
  }
}
