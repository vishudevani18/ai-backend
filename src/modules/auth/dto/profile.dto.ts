import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessDto } from './business.dto';
import { AddressDto } from './address.dto';
import { UserRole, UserStatus } from '../../../database/entities/user.entity';

export class ProfileDto {
  @ApiProperty({ description: "User's unique identifier" })
  id: string;

  @ApiProperty({ description: "User's email address" })
  email: string;

  @ApiProperty({ description: "User's first name" })
  firstName: string;

  @ApiPropertyOptional({ description: "User's last name" })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number (Indian format +91)',
    example: '+919876543210',
  })
  phone?: string;

  @ApiProperty({ description: "Whether the user's email is verified" })
  emailVerified: boolean;

  @ApiProperty({ description: "Whether the user's phone is verified" })
  phoneVerified: boolean;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User account status',
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'User profile image URL (optional)',
  })
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'User primary address',
    type: AddressDto,
  })
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Business details associated with the user',
    type: BusinessDto,
  })
  business?: BusinessDto;

  @ApiProperty({
    description: 'Current credit balance',
    example: 30,
  })
  credits: number;

  @ApiProperty({
    description: 'Date and time user was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time user was last updated',
  })
  updatedAt: Date;

  constructor(partial: Partial<ProfileDto>) {
    Object.assign(this, partial);
  }
}
