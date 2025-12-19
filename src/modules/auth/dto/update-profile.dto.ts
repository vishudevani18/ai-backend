import { IsString, MinLength, MaxLength, IsOptional, Matches, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated first name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Updated last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Updated Indian phone number in +91 format',
    example: '+919876543210',
  })
  @IsOptional()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian number starting with +91',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Updated profile image URL',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid profile image URL' })
  profileImage?: string;
}
