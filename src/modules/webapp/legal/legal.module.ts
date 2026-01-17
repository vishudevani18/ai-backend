import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalController } from './legal.controller';
import { LegalDocumentsService } from '../../admin/legal-documents/legal-documents.service';
import { LegalDocument } from '../../../database/entities/legal-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument])],
  controllers: [LegalController],
  providers: [LegalDocumentsService],
  exports: [LegalDocumentsService],
})
export class LegalModule {}
