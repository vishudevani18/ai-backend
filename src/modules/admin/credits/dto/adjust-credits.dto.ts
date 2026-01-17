import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class AdjustCreditsDto {
  @ApiProperty({
    description: 'Amount to adjust (positive to add, negative to deduct)',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Reason for credit adjustment',
    example: 'Promotional bonus',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
