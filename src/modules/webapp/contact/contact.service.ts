import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactForm, ContactFormStatus } from '../../../database/entities/contact-form.entity';
import { SubmitContactDto } from './dto/submit-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactForm)
    private readonly contactFormRepository: Repository<ContactForm>,
  ) {}

  async submitContactForm(
    dto: SubmitContactDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ContactForm> {
    const contactForm = this.contactFormRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone || null,
      subject: dto.subject,
      message: dto.message,
      status: ContactFormStatus.NEW,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    const saved = await this.contactFormRepository.save(contactForm);

    this.logger.log(`New contact form submission received from ${dto.email}`);

    return saved;
  }
}

