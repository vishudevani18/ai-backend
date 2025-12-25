import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLegalDocumentsTable1736000000000 implements MigrationInterface {
  name = 'CreateLegalDocumentsTable1736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for legal document type
    await queryRunner.query(`
      CREATE TYPE legal_document_type_enum AS ENUM ('privacy_policy', 'terms_of_service');
    `);

    // Create legal_documents table
    await queryRunner.query(`
      CREATE TABLE "legal_documents" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "type" legal_document_type_enum NOT NULL,
        "content" TEXT NOT NULL,
        "last_updated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_legal_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_legal_documents_type" UNIQUE ("type")
      )
    `);

    // Create index on type for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_legal_documents_type" ON "legal_documents" ("type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_legal_documents_type";
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "legal_documents";
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "legal_document_type_enum";
    `);
  }
}

