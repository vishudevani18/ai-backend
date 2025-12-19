import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'OldPass@123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(18)
  oldPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewStrongPass@123',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(18, { message: 'Password must not exceed 18 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,18}$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  newPassword: string;
}
