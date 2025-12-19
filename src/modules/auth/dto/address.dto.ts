import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddressDto {
  @ApiPropertyOptional({
    description: 'Address type (e.g., home, office)',
    example: 'home',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  addressType?: string;

  @ApiPropertyOptional({
    description: 'Street / area',
    example: 'MG Road',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State name',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Zipcode / PIN code',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipcode?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'India',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}
