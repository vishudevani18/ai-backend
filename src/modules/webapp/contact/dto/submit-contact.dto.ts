import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class SubmitContactDto {
  @ApiProperty({
    description: 'Contact name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'john.doe@example.com',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email: string;

  @ApiPropertyOptional({
    description: 'Contact phone number (optional)',
    example: '+919876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phone?: string;

  @ApiProperty({
    description: 'Subject of the contact inquiry',
    example: 'Product Inquiry',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'Subject must be at least 3 characters long' })
  @MaxLength(200, { message: 'Subject must not exceed 200 characters' })
  subject: string;

  @ApiProperty({
    description: 'Contact message',
    example: 'I would like to know more about your services.',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  @MaxLength(5000, { message: 'Message must not exceed 5000 characters' })
  message: string;
}
