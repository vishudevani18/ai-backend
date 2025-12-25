import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIndustryDto {
  @ApiProperty({ example: 'Apparel', description: 'Unique name of the industry' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Clothing, textiles, and fashion industry', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
