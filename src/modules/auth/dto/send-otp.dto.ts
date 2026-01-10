import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendOtpDto {
  @ApiProperty({
    description: 'Indian phone number (with or without +91 prefix)',
    example: '+919876543210 or 9876543210',
  })
  @IsString()
  @Transform(({ value }) => {
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
}
