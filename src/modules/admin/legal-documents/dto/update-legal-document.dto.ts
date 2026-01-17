import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLegalDocumentDto {
  @ApiProperty({
    description: 'HTML content of the legal document',
    example: '<h1>Privacy Policy</h1><p>This is our privacy policy...</p>',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content: string;
}
