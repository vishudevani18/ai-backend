import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContactFormStatus } from '../../../../database/entities/contact-form.entity';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ContactFormStatus,
    description: 'New status for the contact submission',
    example: ContactFormStatus.READ,
  })
  @IsEnum(ContactFormStatus)
  status: ContactFormStatus;
}

