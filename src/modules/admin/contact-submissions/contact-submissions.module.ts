import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactForm } from '../../../database/entities/contact-form.entity';
import { ContactSubmissionsController } from './contact-submissions.controller';
import { ContactSubmissionsService } from './contact-submissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactForm])],
  controllers: [ContactSubmissionsController],
  providers: [ContactSubmissionsService],
  exports: [ContactSubmissionsService],
})
export class ContactSubmissionsModule {}
