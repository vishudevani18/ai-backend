import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string): Promise<User> {
    // Users can only update their own profile unless they're admin
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!['admin', 'super_admin'].includes(currentUser.role) && currentUser.id !== id) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Return user without sensitive data
    const { passwordHash, refreshToken, refreshTokenExpires, ...userWithoutSensitiveData } =
      updatedUser;
    return userWithoutSensitiveData as User;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    currentUserId: string,
  ): Promise<void> {
    // Users can only change their own password unless they're admin
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!['admin', 'super_admin'].includes(currentUser.role) && currentUser.id !== id) {
      throw new UnauthorizedException('You can only change your own password');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password
    await this.userRepository.update(id, {
      passwordHash: hashedNewPassword,
    });
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    // Only admins can delete users
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!['admin', 'super_admin'].includes(currentUser.role)) {
      throw new UnauthorizedException('Only admins can delete users');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.userRepository.softDelete(id);
  }

  async toggleActive(id: string, currentUserId: string): Promise<User> {
    // Only admins can toggle user active status
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (!['admin', 'super_admin'].includes(currentUser.role)) {
      throw new UnauthorizedException('Only admins can toggle user status');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const updatedUser = await this.userRepository.save(user);

    // Return user without sensitive data
    const { passwordHash, refreshToken, refreshTokenExpires, ...userWithoutSensitiveData } =
      updatedUser;
    return userWithoutSensitiveData as User;
  }
}
