import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsEnum } from 'class-validator';
import { OtpPurpose } from '../../../common/constants/auth.constants';

export class ResendOtpDto {
  @ApiProperty({
    description: 'Indian phone number in +91 format',
    example: '+919876543210',
  })
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian number starting with +91',
  })
  phone: string;

  @ApiProperty({
    description: 'Purpose of the OTP',
    enum: OtpPurpose,
    example: OtpPurpose.SIGNUP,
  })
  @IsEnum(OtpPurpose, {
    message: 'Purpose must be either signup or reset_password',
  })
  purpose: OtpPurpose;
}
