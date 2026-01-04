import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address or phone number of the user (phone can be with or without +91 prefix)',
    example: 'user@example.com or +919876543210 or 9876543210',
  })
  @IsString()
  @Transform(({ value }) => {
    // If it contains @, it's an email - return as is
    if (value.includes('@')) {
      return value;
    }
    
    // Otherwise, treat as phone number and normalize
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
  emailOrPhone: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPass@123',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(18, { message: 'Password must not exceed 18 characters' })
  password: string;
}
