import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactForm } from '../../../database/entities/contact-form.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactForm])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}

