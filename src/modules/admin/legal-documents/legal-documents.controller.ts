import { ROUTES } from '../../../common/constants';
import { Controller, Get, Put, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { LegalDocumentsService } from './legal-documents.service';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('2. Admin - Legal Documents')
@Controller(ROUTES.ADMIN.LEGAL_DOCUMENTS)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class LegalDocumentsController {
  constructor(private readonly legalDocumentsService: LegalDocumentsService) {}

  @Put('privacy-policy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update privacy policy' })
  @ApiResponse({ status: 200, description: 'Privacy policy updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePrivacyPolicy(@Body() dto: UpdateLegalDocumentDto) {
    const document = await this.legalDocumentsService.updatePrivacyPolicy(dto);
    return ResponseUtil.success(document, 'Privacy policy updated successfully');
  }

  @Put('terms-of-service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update terms of service' })
  @ApiResponse({ status: 200, description: 'Terms of service updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTermsOfService(@Body() dto: UpdateLegalDocumentDto) {
    const document = await this.legalDocumentsService.updateTermsOfService(dto);
    return ResponseUtil.success(document, 'Terms of service updated successfully');
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Get privacy policy' })
  @ApiResponse({ status: 200, description: 'Privacy policy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Privacy policy not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPrivacyPolicy() {
    const document = await this.legalDocumentsService.getPrivacyPolicy();
    if (!document) {
      return ResponseUtil.success(
        { id: null, content: '', lastUpdated: null },
        'Privacy policy not found',
      );
    }
    return ResponseUtil.success(
      {
        id: document.id,
        content: document.content,
        lastUpdated: document.lastUpdated,
      },
      'Privacy policy retrieved successfully',
    );
  }

  @Get('terms-of-service')
  @ApiOperation({ summary: 'Get terms of service' })
  @ApiResponse({ status: 200, description: 'Terms of service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Terms of service not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTermsOfService() {
    const document = await this.legalDocumentsService.getTermsOfService();
    if (!document) {
      return ResponseUtil.success(
        { id: null, content: '', lastUpdated: null },
        'Terms of service not found',
      );
    }
    return ResponseUtil.success(
      {
        id: document.id,
        content: document.content,
        lastUpdated: document.lastUpdated,
      },
      'Terms of service retrieved successfully',
    );
  }
}
