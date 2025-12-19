import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address or phone number of the user',
    example: 'user@example.com or +919876543210',
  })
  @IsString()
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
