import { Entity, Column, Unique, Index, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum LegalDocumentType {
  PRIVACY_POLICY = 'privacy_policy',
  TERMS_OF_SERVICE = 'terms_of_service',
}

@Entity('legal_documents')
@Unique(['type'])
export class LegalDocument extends BaseEntity {
  @Column({
    type: 'enum',
    enum: LegalDocumentType,
  })
  type: LegalDocumentType; // Unique constraint automatically creates index

  @Column({ type: 'text' })
  content: string; // HTML content

  @UpdateDateColumn({
    name: 'last_updated',
    type: 'timestamp with time zone',
  })
  lastUpdated: Date;
}
