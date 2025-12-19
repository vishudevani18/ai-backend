import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class UpdateAdminDto {
  @ApiPropertyOptional({
    description: 'Admin email address',
    example: 'admin@example.com',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email?: string;

  @ApiPropertyOptional({
    description: 'First name of the admin',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the admin',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Indian phone number in +91 format',
    example: '+919876543210',
  })
  @IsOptional()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian number starting with +91',
  })
  phone?: string;
}
