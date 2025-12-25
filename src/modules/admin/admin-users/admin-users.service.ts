import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../../../database/entities/user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { BCRYPT_SALT_ROUNDS } from '../../../common/constants/auth.constants';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createAdminDto: CreateAdminDto, currentUserId: string): Promise<User> {
    // Only super admin can create admins
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can create admin users');
    }

    // Check if email already exists
    const emailExists = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });
    if (emailExists) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if phone already exists
    const phoneExists = await this.userRepository.findOne({
      where: { phone: createAdminDto.phone },
    });
    if (phoneExists) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createAdminDto.password, BCRYPT_SALT_ROUNDS);

    // Create admin user
    const admin = this.userRepository.create({
      email: createAdminDto.email,
      passwordHash,
      firstName: createAdminDto.firstName,
      lastName: createAdminDto.lastName || null,
      phone: createAdminDto.phone,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true, // Admins are pre-verified
      phoneVerified: true, // Admins are pre-verified
    });

    const savedAdmin = await this.userRepository.save(admin);

    // Return without sensitive data
    const {
      passwordHash: _,
      refreshToken,
      refreshTokenExpires,
      ...adminWithoutSensitive
    } = savedAdmin;
    return adminWithoutSensitive as User;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    email?: string;
    phone?: string;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ admins: User[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      email,
      phone,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
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

    const [admins, total] = await queryBuilder.getManyAndCount();

    return { admins, total };
  }

  async findOne(id: string): Promise<User> {
    const admin = await this.userRepository.findOne({
      where: [
        { id, role: UserRole.ADMIN },
        { id, role: UserRole.SUPER_ADMIN },
      ],
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

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto, currentUserId: string): Promise<User> {
    // Only super admin can update admins
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can update admin users');
    }

    const admin = await this.userRepository.findOne({
      where: [
        { id, role: UserRole.ADMIN },
        { id, role: UserRole.SUPER_ADMIN },
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Check if email is being updated and if it conflicts
    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateAdminDto.email },
      });
      if (emailExists) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Check if phone is being updated and if it conflicts
    if (updateAdminDto.phone && updateAdminDto.phone !== admin.phone) {
      const phoneExists = await this.userRepository.findOne({
        where: { phone: updateAdminDto.phone },
      });
      if (phoneExists) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    Object.assign(admin, updateAdminDto);
    const updatedAdmin = await this.userRepository.save(admin);

    // Return without sensitive data
    const {
      passwordHash: _,
      refreshToken,
      refreshTokenExpires,
      ...adminWithoutSensitive
    } = updatedAdmin;
    return adminWithoutSensitive as User;
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    // Only super admin can delete admins
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can delete admin users');
    }

    // Prevent deleting yourself
    if (currentUserId === id) {
      throw new BadRequestException('You cannot delete yourself');
    }

    const admin = await this.userRepository.findOne({
      where: [
        { id, role: UserRole.ADMIN },
        { id, role: UserRole.SUPER_ADMIN },
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Soft delete
    await this.userRepository.softDelete(id);
  }

  async toggleActive(id: string, currentUserId: string): Promise<User> {
    // Only super admin can toggle admin status
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
    });

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admin can toggle admin status');
    }

    // Prevent deactivating yourself
    if (currentUserId === id) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    const admin = await this.userRepository.findOne({
      where: [
        { id, role: UserRole.ADMIN },
        { id, role: UserRole.SUPER_ADMIN },
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    admin.status = admin.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    const updatedAdmin = await this.userRepository.save(admin);

    // Return without sensitive data
    const {
      passwordHash: _,
      refreshToken,
      refreshTokenExpires,
      ...adminWithoutSensitive
    } = updatedAdmin;
    return adminWithoutSensitive as User;
  }
}
