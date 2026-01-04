import { IsString, MinLength, MaxLength, IsOptional, ValidateNested, IsObject, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from '../../auth/dto/address.dto';
import { BusinessDto } from '../../auth/dto/business.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address (read-only, cannot be updated via this endpoint)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
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
