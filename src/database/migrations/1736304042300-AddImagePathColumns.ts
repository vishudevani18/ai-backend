import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagePathColumns1736304042300 implements MigrationInterface {
  name = 'AddImagePathColumns1736304042300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add image_path column to categories table
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "image_path" TEXT;
    `);

    // Add image_path column to product_themes table
    await queryRunner.query(`
      ALTER TABLE "product_themes"
      ADD COLUMN IF NOT EXISTS "image_path" TEXT;
    `);

    // Add image_path column to product_backgrounds table
    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      ADD COLUMN IF NOT EXISTS "image_path" TEXT;
    `);

    // Add image_path column to product_poses table
    await queryRunner.query(`
      ALTER TABLE "product_poses"
      ADD COLUMN IF NOT EXISTS "image_path" TEXT;
    `);

    // Populate image_path from existing image_url values where possible
    // Extract path from public GCS URLs: https://storage.googleapis.com/{bucket}/{path}
    await queryRunner.query(`
      UPDATE "categories"
      SET "image_path" = SUBSTRING("image_url" FROM 'storage\\.googleapis\\.com/[^/]+/(.+?)(\\?|$)')
      WHERE "image_url" IS NOT NULL 
        AND "image_url" LIKE '%storage.googleapis.com%'
        AND "image_path" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "product_themes"
      SET "image_path" = SUBSTRING("image_url" FROM 'storage\\.googleapis\\.com/[^/]+/(.+?)(\\?|$)')
      WHERE "image_url" IS NOT NULL 
        AND "image_url" LIKE '%storage.googleapis.com%'
        AND "image_path" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "product_backgrounds"
      SET "image_path" = SUBSTRING("image_url" FROM 'storage\\.googleapis\\.com/[^/]+/(.+?)(\\?|$)')
      WHERE "image_url" IS NOT NULL 
        AND "image_url" LIKE '%storage.googleapis.com%'
        AND "image_path" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "product_poses"
      SET "image_path" = SUBSTRING("image_url" FROM 'storage\\.googleapis\\.com/[^/]+/(.+?)(\\?|$)')
      WHERE "image_url" IS NOT NULL 
        AND "image_url" LIKE '%storage.googleapis.com%'
        AND "image_path" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove image_path columns
    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "image_path";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_themes"
      DROP COLUMN IF EXISTS "image_path";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      DROP COLUMN IF EXISTS "image_path";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_poses"
      DROP COLUMN IF EXISTS "image_path";
    `);
  }
}

