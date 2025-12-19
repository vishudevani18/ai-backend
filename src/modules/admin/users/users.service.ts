import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../../database/entities/user.entity';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    // Only return regular users (not admins or super admins)
    const [users, total] = await this.userRepository.findAndCount({
      where: { role: UserRole.USER },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.USER },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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
      where: { id, role: UserRole.USER },
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
      where: { id, role: UserRole.USER },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const updatedUser = await this.userRepository.save(user);

    // Return user without sensitive data
    const {
      passwordHash: _,
      refreshToken,
      refreshTokenExpires,
      ...userWithoutSensitiveData
    } = updatedUser;
    return userWithoutSensitiveData as User;
  }
}
