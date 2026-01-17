import { IsString, IsUUID, IsOptional, Length, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AiFaceGender } from '../../../../database/entities/ai-face.entity';

export class CreateAiFaceDto {
  @ApiProperty({ example: 'Professional Woman Face 1', description: 'Name of the AI face' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'Professional looking face for women', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: AiFaceGender.FEMALE,
    enum: AiFaceGender,
    description: 'Gender of the AI face (male or female)',
  })
  @IsEnum(AiFaceGender)
  gender: AiFaceGender;

  @ApiProperty({ example: 'uuid-of-category', description: 'ID of the related category' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (JPEG, PNG, WebP, GIF)',
    required: true,
  })
  image: any; // File will be handled by FileInterceptor
}
