import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocument, LegalDocumentType } from '../../../database/entities/legal-document.entity';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';

@Injectable()
export class LegalDocumentsService {
  constructor(
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
  ) {}

  async updatePrivacyPolicy(dto: UpdateLegalDocumentDto): Promise<LegalDocument> {
    let document = await this.legalDocumentRepository.findOne({
      where: { type: LegalDocumentType.PRIVACY_POLICY },
    });

    if (document) {
      document.content = dto.content;
      document.lastUpdated = new Date();
      return this.legalDocumentRepository.save(document);
    } else {
      document = this.legalDocumentRepository.create({
        type: LegalDocumentType.PRIVACY_POLICY,
        content: dto.content,
        lastUpdated: new Date(),
      });
      return this.legalDocumentRepository.save(document);
    }
  }

  async updateTermsOfService(dto: UpdateLegalDocumentDto): Promise<LegalDocument> {
    let document = await this.legalDocumentRepository.findOne({
      where: { type: LegalDocumentType.TERMS_OF_SERVICE },
    });

    if (document) {
      document.content = dto.content;
      document.lastUpdated = new Date();
      return this.legalDocumentRepository.save(document);
    } else {
      document = this.legalDocumentRepository.create({
        type: LegalDocumentType.TERMS_OF_SERVICE,
        content: dto.content,
        lastUpdated: new Date(),
      });
      return this.legalDocumentRepository.save(document);
    }
  }

  async getPrivacyPolicy(): Promise<LegalDocument | null> {
    return this.legalDocumentRepository.findOne({
      where: { type: LegalDocumentType.PRIVACY_POLICY },
    });
  }

  async getTermsOfService(): Promise<LegalDocument | null> {
    return this.legalDocumentRepository.findOne({
      where: { type: LegalDocumentType.TERMS_OF_SERVICE },
    });
  }
}
