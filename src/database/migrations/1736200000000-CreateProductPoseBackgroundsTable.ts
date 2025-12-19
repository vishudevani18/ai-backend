import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductPoseBackgroundsTable1736200000000 implements MigrationInterface {
  name = 'CreateProductPoseBackgroundsTable1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create product_pose_backgrounds junction table
    await queryRunner.query(`
      CREATE TABLE "product_pose_backgrounds" (
        "product_pose_id" UUID NOT NULL,
        "product_background_id" UUID NOT NULL,
        PRIMARY KEY ("product_pose_id", "product_background_id"),
        CONSTRAINT "FK_product_pose_backgrounds_pose" 
          FOREIGN KEY ("product_pose_id") 
          REFERENCES "product_poses"("id") 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
        CONSTRAINT "FK_product_pose_backgrounds_background" 
          FOREIGN KEY ("product_background_id") 
          REFERENCES "product_backgrounds"("id") 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_product_pose_backgrounds_pose" 
      ON "product_pose_backgrounds" ("product_pose_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_pose_backgrounds_background" 
      ON "product_pose_backgrounds" ("product_background_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_product_pose_backgrounds_background";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_product_pose_backgrounds_pose";
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "product_pose_backgrounds";
    `);
  }
}

