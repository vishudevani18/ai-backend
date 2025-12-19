import { Controller, Get } from '@nestjs/common';
import { LegalDocumentsService } from '../../admin/legal-documents/legal-documents.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ROUTES } from '../../../common/constants';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('WebApp - Legal Documents')
@Controller(ROUTES.WEBAPP.LEGAL_BASE)
export class LegalController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Public()
  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get privacy policy (Public)' })
  @ApiResponse({ status: 200, description: 'Privacy policy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Privacy policy not found' })
  async getPrivacyPolicy() {
    const document = await this.legalDocumentsService.getPrivacyPolicy();
    if (!document) {
      return ResponseUtil.success(
        { content: '', lastUpdated: null },
        'Privacy policy not found',
      );
    }
    return ResponseUtil.success(
      {
        content: document.content,
        lastUpdated: document.lastUpdated,
      },
      'Privacy policy retrieved successfully',
    );
  }

  @Public()
  @Get('terms-of-service')
  @ApiOperation({ summary: 'Get terms of service (Public)' })
  @ApiResponse({ status: 200, description: 'Terms of service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Terms of service not found' })
  async getTermsOfService() {
    const document = await this.legalDocumentsService.getTermsOfService();
    if (!document) {
      return ResponseUtil.success(
        { content: '', lastUpdated: null },
        'Terms of service not found',
      );
    }
    return ResponseUtil.success(
      {
        content: document.content,
        lastUpdated: document.lastUpdated,
      },
      'Terms of service retrieved successfully',
    );
  }
}

