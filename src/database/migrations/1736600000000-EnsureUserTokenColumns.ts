import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUserTokenColumns1736600000000 implements MigrationInterface {
  name = 'EnsureUserTokenColumns1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if refresh_token column exists, if not add it
    const refreshTokenExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'refresh_token';
    `);

    if (refreshTokenExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "refresh_token" TEXT;
      `);
    }

    // Check if refresh_token_expires column exists, if not add it
    const refreshTokenExpiresExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'refresh_token_expires';
    `);

    if (refreshTokenExpiresExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "refresh_token_expires" TIMESTAMP WITH TIME ZONE;
      `);
    }

    // Check if password_reset_token column exists, if not add it
    const passwordResetTokenExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_reset_token';
    `);

    if (passwordResetTokenExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "password_reset_token" VARCHAR(255);
      `);
    }

    // Check if password_reset_expires column exists, if not add it
    const passwordResetExpiresExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_reset_expires';
    `);

    if (passwordResetExpiresExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" 
        ADD COLUMN "password_reset_expires" TIMESTAMP;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns if they exist (safely)
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "refresh_token";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "refresh_token_expires";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "password_reset_token";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "password_reset_expires";
    `);
  }
}

