import { Entity, Column, OneToMany, OneToOne, Index, Check } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserAddress } from './user-address.entity';
import { UserBusiness } from './user-business.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity('users')
@Index(['email', 'status'])
@Index(['phone', 'status'])
@Index(['role', 'status', 'createdAt'])
@Index(['credits'], { where: 'deleted_at IS NULL AND credits > 0' })
@Check(`"credits" >= 0`)
@Check(`"phone" ~ '^\\+91[6-9]\\d{9}$'`)
export class User extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @Column({ name: 'email', unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'phone', length: 20, unique: true })
  phone: string;

  @Column({ name: 'profile_image', type: 'varchar', length: 500, nullable: true })
  profileImage?: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'last_login', type: 'timestamp with time zone', nullable: true })
  lastLogin?: Date;

  // Stored hashed — for security
  @Column({ name: 'refresh_token', type: 'varchar', length: 255, nullable: true, select: false })
  refreshToken?: string;

  @Column({
    name: 'refresh_token_expires',
    type: 'timestamp with time zone',
    nullable: true,
    select: false,
  })
  refreshTokenExpires?: Date;

  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true, select: false })
  passwordResetExpires?: Date;

  @Column({
    name: 'credits',
    type: 'integer',
    default: 0,
    nullable: false,
  })
  credits: number;

  @OneToMany(() => UserAddress, address => address.user, { cascade: true })
  addresses: UserAddress[];

  @OneToOne(() => UserBusiness, business => business.user, { cascade: true })
  business?: UserBusiness;
}
