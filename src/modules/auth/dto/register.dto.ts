import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessDto } from './business.dto';
import { AddressDto } from './address.dto';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPass@123',
    minLength: 8,
    maxLength: 18,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(18, { message: 'Password must not exceed 18 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,18}$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    description: 'Indian phone number (with or without +91 prefix)',
    example: '+919876543210 or 9876543210',
    required: false,
  })
  @Transform(({ value }) => {
    if (!value) return value;
    // Remove any spaces, dashes, or other characters
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    
    // If it doesn't start with +91, add it
    if (!cleaned.startsWith('+91')) {
      // Remove leading 0 if present
      const withoutZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
      return `+91${withoutZero}`;
    }
    
    return cleaned;
  })
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian number (10 digits, starting with 6-9)',
  })
  phone: string;
  // NEW 🔥
  @ApiProperty({
    description: 'User primary address',
    required: false,
    type: AddressDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
  @ApiProperty({
    description: 'Optional business information',
    type: BusinessDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessDto)
  business?: BusinessDto;
}
