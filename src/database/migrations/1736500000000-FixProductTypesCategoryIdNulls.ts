import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductTypesCategoryIdNulls1736500000000 implements MigrationInterface {
  name = 'FixProductTypesCategoryIdNulls1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, delete any product_types rows with NULL category_id
    // These are orphaned records that shouldn't exist
    await queryRunner.query(`
      DELETE FROM "product_types" 
      WHERE "category_id" IS NULL;
    `);

    // Ensure category_id is NOT NULL (should already be, but making sure)
    await queryRunner.query(`
      ALTER TABLE "product_types" 
      ALTER COLUMN "category_id" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Allow NULL values (though this shouldn't be needed)
    await queryRunner.query(`
      ALTER TABLE "product_types" 
      ALTER COLUMN "category_id" DROP NOT NULL;
    `);
  }
}

