import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlColumns1736100000000 implements MigrationInterface {
  name = 'AddImageUrlColumns1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add image_url column to product_backgrounds
    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      ADD COLUMN IF NOT EXISTS "image_url" TEXT;
    `);

    // Add image_url column to product_poses
    await queryRunner.query(`
      ALTER TABLE "product_poses"
      ADD COLUMN IF NOT EXISTS "image_url" TEXT;
    `);

    // Add image_url column to categories
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "image_url" TEXT;
    `);

    // Add image_url column to product_themes
    await queryRunner.query(`
      ALTER TABLE "product_themes"
      ADD COLUMN IF NOT EXISTS "image_url" TEXT;
    `);

    // Make image_base64 nullable in product_backgrounds (for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      ALTER COLUMN "image_base64" DROP NOT NULL;
    `);

    // Make image_base64 nullable in product_poses (for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE "product_poses"
      ALTER COLUMN "image_base64" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove image_url columns
    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      DROP COLUMN IF EXISTS "image_url";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_poses"
      DROP COLUMN IF EXISTS "image_url";
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "image_url";
    `);

    await queryRunner.query(`
      ALTER TABLE "product_themes"
      DROP COLUMN IF EXISTS "image_url";
    `);

    // Restore NOT NULL constraints (if needed)
    await queryRunner.query(`
      ALTER TABLE "product_backgrounds"
      ALTER COLUMN "image_base64" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "product_poses"
      ALTER COLUMN "image_base64" SET NOT NULL;
    `);
  }
}

