import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixJunctionTableColumnTypes1736700000000 implements MigrationInterface {
  name = 'FixJunctionTableColumnTypes1736700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix product_type_themes table
    const productTypeThemesThemeId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_type_themes' AND column_name = 'theme_id';
    `);

    if (productTypeThemesThemeId.length > 0 && productTypeThemesThemeId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_type_themes" 
        ALTER COLUMN "theme_id" TYPE UUID USING "theme_id"::uuid;
      `);
    }

    const productTypeThemesProductTypeId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_type_themes' AND column_name = 'product_type_id';
    `);

    if (productTypeThemesProductTypeId.length > 0 && productTypeThemesProductTypeId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_type_themes" 
        ALTER COLUMN "product_type_id" TYPE UUID USING "product_type_id"::uuid;
      `);
    }

    // Fix product_theme_backgrounds table
    const productThemeBackgroundsThemeId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_theme_backgrounds' AND column_name = 'product_theme_id';
    `);

    if (productThemeBackgroundsThemeId.length > 0 && productThemeBackgroundsThemeId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_theme_backgrounds" 
        ALTER COLUMN "product_theme_id" TYPE UUID USING "product_theme_id"::uuid;
      `);
    }

    const productThemeBackgroundsBackgroundId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_theme_backgrounds' AND column_name = 'product_background_id';
    `);

    if (productThemeBackgroundsBackgroundId.length > 0 && productThemeBackgroundsBackgroundId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_theme_backgrounds" 
        ALTER COLUMN "product_background_id" TYPE UUID USING "product_background_id"::uuid;
      `);
    }

    // Fix product_pose_backgrounds table
    const productPoseBackgroundsPoseId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_pose_backgrounds' AND column_name = 'product_pose_id';
    `);

    if (productPoseBackgroundsPoseId.length > 0 && productPoseBackgroundsPoseId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_pose_backgrounds" 
        ALTER COLUMN "product_pose_id" TYPE UUID USING "product_pose_id"::uuid;
      `);
    }

    const productPoseBackgroundsBackgroundId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_pose_backgrounds' AND column_name = 'product_background_id';
    `);

    if (productPoseBackgroundsBackgroundId.length > 0 && productPoseBackgroundsBackgroundId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_pose_backgrounds" 
        ALTER COLUMN "product_background_id" TYPE UUID USING "product_background_id"::uuid;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert is not recommended as it could cause data loss
    // This migration is one-way to fix the schema
  }
}

