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

  async findAll(filters: {
    page?: number;
    limit?: number;
    email?: string;
    phone?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      email,
      phone,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    // Build query with TypeORM
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.USER })
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.role',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ]);

    // Apply filters
    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (phone) {
      queryBuilder.andWhere('user.phone ILIKE :phone', { phone: `%${phone}%` });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

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
