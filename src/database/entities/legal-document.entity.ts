import { Entity, Column, Unique } from 'typeorm';
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
    unique: true,
  })
  type: LegalDocumentType;

  @Column({ type: 'text' })
  content: string; // HTML content

  @Column({
    name: 'last_updated',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUpdated: Date;
}

