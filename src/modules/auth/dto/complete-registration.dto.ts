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
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessDto } from './business.dto';
import { AddressDto } from './address.dto';

export class CompleteRegistrationDto {
  @ApiProperty({
    description: 'Session token received from OTP verification',
    example: 'abc123def456...',
  })
  @IsString()
  sessionToken: string;

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

  @ApiPropertyOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User primary address',
    type: AddressDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Optional business information',
    type: BusinessDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusinessDto)
  business?: BusinessDto;
}
