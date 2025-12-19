import { IsString, IsOptional, MaxLength, IsEnum, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType, BusinessSegment } from '../../../database/entities/user-business.entity';

export class BusinessDto {
  @ApiPropertyOptional({
    description: 'Business name',
    example: 'ABC Enterprises',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'Business name must be a string' })
  @MaxLength(150, { message: 'Business name must not exceed 150 characters' })
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    example: BusinessType.MANUFACTURER,
    enum: BusinessType,
  })
  @IsOptional()
  @IsEnum(BusinessType, {
    message: 'Business type must be one of: manufacturer, reseller, wholesaler, other',
  })
  businessType?: BusinessType;

  @ApiPropertyOptional({
    description: 'Business segment category',
    example: BusinessSegment.CLOTHING,
    enum: BusinessSegment,
  })
  @IsOptional()
  @IsEnum(BusinessSegment, {
    message:
      'Business segment must be one of: clothing, accessories, furniture, electronics, other',
  })
  businessSegment?: BusinessSegment;

  @ApiPropertyOptional({
    description: 'Description of the business',
    example: 'We manufacture high-quality clothing products.',
  })
  @IsOptional()
  @IsString({ message: 'Business description must be a string' })
  businessDescription?: string;

  @ApiPropertyOptional({
    description: 'GST number',
    example: '27ABCDE1234F1Z5',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'Official business website URL',
    example: 'https://www.example.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of the business logo',
    example: 'https://www.example.com/logo.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid logo URL' })
  businessLogo?: string;
}
