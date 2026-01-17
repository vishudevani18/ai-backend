import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { RateLimit } from '../../../security/decorators/rate-limit.decorator';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('1. WebApp - Contact')
@Controller('webapp/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @RateLimit({ limit: 5, window: 60 * 15 }) // 5 submissions per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit contact form (Public)',
    description:
      'Submit a contact form inquiry from the landing page. Rate limited to 5 submissions per 15 minutes per IP address.',
  })
  @ApiBody({ type: SubmitContactDto })
  @ApiResponse({
    status: 200,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async submitContact(@Body() dto: SubmitContactDto, @Req() req: Request) {
    // Extract IP address from request
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      undefined;

    // Extract user agent
    const userAgent = req.headers['user-agent'] || undefined;

    const contactForm = await this.contactService.submitContactForm(dto, ipAddress, userAgent);

    return ResponseUtil.success(
      {
        id: contactForm.id,
        submittedAt: contactForm.createdAt,
      },
      'Thank you for contacting us! We will get back to you soon.',
    );
  }
}
