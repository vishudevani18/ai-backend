import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddGenerationTypeToGeneratedImages1736900000000 implements MigrationInterface {
  name = 'AddGenerationTypeToGeneratedImages1736900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create generation_type enum
    await queryRunner.query(`
      CREATE TYPE generation_type_enum AS ENUM ('single', 'bulk');
    `);

    // Add generation_type column with default value 'single'
    await queryRunner.query(`
      ALTER TABLE "generated_images"
      ADD COLUMN "generation_type" generation_type_enum NOT NULL DEFAULT 'single';
    `);

    // Create index on generation_type for efficient queries
    await queryRunner.createIndex(
      'generated_images',
      new TableIndex({
        name: 'IDX_generated_images_generation_type',
        columnNames: ['generation_type'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('generated_images', 'IDX_generated_images_generation_type');

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "generated_images"
      DROP COLUMN "generation_type";
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE generation_type_enum;
    `);
  }
}

