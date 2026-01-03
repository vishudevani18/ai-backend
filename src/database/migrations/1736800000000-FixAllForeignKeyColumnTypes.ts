import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAllForeignKeyColumnTypes1736800000000 implements MigrationInterface {
  name = 'FixAllForeignKeyColumnTypes1736800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix categories.industry_id
    const categoryIndustryId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'industry_id';
    `);

    if (categoryIndustryId.length > 0 && categoryIndustryId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "categories" 
        ALTER COLUMN "industry_id" TYPE UUID USING "industry_id"::uuid;
      `);
    }

    // Fix product_types.category_id
    const productTypeCategoryId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_types' AND column_name = 'category_id';
    `);

    if (productTypeCategoryId.length > 0 && productTypeCategoryId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_types" 
        ALTER COLUMN "category_id" TYPE UUID USING "category_id"::uuid;
      `);
    }

    // Fix product_poses.product_type_id
    const productPoseProductTypeId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_poses' AND column_name = 'product_type_id';
    `);

    if (productPoseProductTypeId.length > 0 && productPoseProductTypeId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "product_poses" 
        ALTER COLUMN "product_type_id" TYPE UUID USING "product_type_id"::uuid;
      `);
    }

    // Fix ai_faces.category_id
    const aiFaceCategoryId = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_faces' AND column_name = 'category_id';
    `);

    if (aiFaceCategoryId.length > 0 && aiFaceCategoryId[0].data_type !== 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "ai_faces" 
        ALTER COLUMN "category_id" TYPE UUID USING "category_id"::uuid;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert is not recommended as it could cause data loss
    // This migration is one-way to fix the schema
  }
}

