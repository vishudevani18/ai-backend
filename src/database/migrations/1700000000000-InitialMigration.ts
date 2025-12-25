import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pgcrypto extension (required for gen_random_uuid())
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);

    // Create enum types
    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'super_admin');
    `);

    await queryRunner.query(`
      CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'banned');
    `);

    await queryRunner.query(`
      CREATE TYPE business_type_enum AS ENUM ('manufacturer', 'reseller', 'wholesaler', 'other');
    `);

    await queryRunner.query(`
      CREATE TYPE business_segment_enum AS ENUM ('clothing', 'accessories', 'furniture', 'electronics', 'other');
    `);

    await queryRunner.query(`
      CREATE TYPE subscription_plan_enum AS ENUM ('free', 'basic', 'pro', 'enterprise');
    `);

    await queryRunner.query(`
      CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'expired', 'canceled');
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100),
        "email" VARCHAR(150) UNIQUE NOT NULL,
        "password_hash" TEXT NOT NULL,
        "phone" VARCHAR(20),
        "profile_image" TEXT,
        "email_verified" BOOLEAN DEFAULT FALSE,
        "phone_verified" BOOLEAN DEFAULT FALSE,
        "email_subscribed" BOOLEAN DEFAULT FALSE,
        "role" user_role_enum DEFAULT 'user',
        "status" user_status_enum DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "last_login" TIMESTAMP WITH TIME ZONE,
        "referral_code" VARCHAR(50),
        "refresh_token" TEXT,
        "refresh_token_expires" TIMESTAMP WITH TIME ZONE,
        "password_reset_token" VARCHAR(255),
        "password_reset_expires" TIMESTAMP,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // Create images table
    await queryRunner.query(`
      CREATE TABLE "images" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "title" VARCHAR NOT NULL,
        "description" VARCHAR,
        "prompt" VARCHAR NOT NULL,
        "filePath" VARCHAR NOT NULL,
        "fileName" VARCHAR NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" VARCHAR NOT NULL,
        "metadata" VARCHAR,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "userId" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_images_id" PRIMARY KEY ("id")
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "plan" VARCHAR NOT NULL DEFAULT 'free',
        "stripeSubscriptionId" VARCHAR,
        "stripeCustomerId" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'inactive',
        "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
        "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_subscriptions_id" PRIMARY KEY ("id")
      )
    `);

    // Create user_addresses table
    await queryRunner.query(`
      CREATE TABLE "user_addresses" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "address_type" VARCHAR(50) DEFAULT 'default',
        "street" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(100),
        "zipcode" VARCHAR(20),
        "country" VARCHAR(100) DEFAULT 'India',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_user_addresses_id" PRIMARY KEY ("id")
      )
    `);

    // Create user_businesses table
    await queryRunner.query(`
      CREATE TABLE "user_businesses" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID UNIQUE NOT NULL,
        "business_name" VARCHAR(150),
        "business_type" business_type_enum,
        "business_segment" business_segment_enum,
        "business_description" TEXT,
        "gst_number" VARCHAR(20),
        "website_url" TEXT,
        "business_logo" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_user_businesses_id" PRIMARY KEY ("id")
      )
    `);

    // Create user_subscriptions table
    await queryRunner.query(`
      CREATE TABLE "user_subscriptions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "plan" subscription_plan_enum DEFAULT 'free',
        "status" subscription_status_enum DEFAULT 'trial',
        "start_date" DATE DEFAULT CURRENT_DATE,
        "end_date" DATE,
        "auto_renew" BOOLEAN DEFAULT TRUE,
        "payment_method" VARCHAR(50),
        "credits_remaining" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_user_subscriptions_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "images" 
      ADD CONSTRAINT "FK_images_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_addresses" 
      ADD CONSTRAINT "FK_user_addresses_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_businesses" 
      ADD CONSTRAINT "FK_user_businesses_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_subscriptions" 
      ADD CONSTRAINT "FK_user_subscriptions_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create industries table
    await queryRunner.query(`
      CREATE TABLE "industries" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR UNIQUE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_industries_id" PRIMARY KEY ("id")
      )
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "image_url" TEXT,
        "industry_id" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_industry_id" 
          FOREIGN KEY ("industry_id") REFERENCES "industries"("id") ON DELETE CASCADE
      )
    `);

    // Create product_types table
    await queryRunner.query(`
      CREATE TABLE "product_types" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "category_id" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_product_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_types_category_id" 
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    // Create product_themes table
    await queryRunner.query(`
      CREATE TABLE "product_themes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR UNIQUE NOT NULL,
        "description" TEXT,
        "image_url" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_product_themes_id" PRIMARY KEY ("id")
      )
    `);

    // Create product_backgrounds table
    await queryRunner.query(`
      CREATE TABLE "product_backgrounds" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "image_base64" TEXT,
        "image_url" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_product_backgrounds_id" PRIMARY KEY ("id")
      )
    `);

    // Create product_poses table
    await queryRunner.query(`
      CREATE TABLE "product_poses" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "image_base64" TEXT,
        "image_url" TEXT,
        "product_type_id" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_product_poses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_poses_product_type_id" 
          FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE
      )
    `);

    // Create product_type_themes junction table
    await queryRunner.query(`
      CREATE TABLE "product_type_themes" (
        "theme_id" UUID NOT NULL,
        "product_type_id" UUID NOT NULL,
        PRIMARY KEY ("theme_id", "product_type_id"),
        CONSTRAINT "FK_product_type_themes_theme_id" 
          FOREIGN KEY ("theme_id") REFERENCES "product_themes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_type_themes_product_type_id" 
          FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE
      )
    `);

    // Create product_theme_backgrounds junction table
    await queryRunner.query(`
      CREATE TABLE "product_theme_backgrounds" (
        "product_theme_id" UUID NOT NULL,
        "product_background_id" UUID NOT NULL,
        PRIMARY KEY ("product_theme_id", "product_background_id"),
        CONSTRAINT "FK_product_theme_backgrounds_theme_id" 
          FOREIGN KEY ("product_theme_id") REFERENCES "product_themes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_product_theme_backgrounds_background_id" 
          FOREIGN KEY ("product_background_id") REFERENCES "product_backgrounds"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_images_userId" ON "images" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_images_isPublic" ON "images" ("isPublic")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_userId" ON "subscriptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_business_user_id" ON "user_businesses" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_subscription_user_id" ON "user_subscriptions" ("user_id")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_industries_name" ON "industries" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_name" ON "categories" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_industry_id" ON "categories" ("industry_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_types_name" ON "product_types" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_types_category_id" ON "product_types" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_poses_name" ON "product_poses" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_poses_product_type_id" ON "product_poses" ("product_type_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_backgrounds_name" ON "product_backgrounds" ("name")`);

    // Create trigger function for auto-updating updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create trigger for users table
    await queryRunner.query(`
      CREATE TRIGGER set_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS set_timestamp ON users`);

    // Drop trigger function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_backgrounds_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_poses_product_type_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_poses_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_types_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_types_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_industry_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_industries_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_subscription_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_business_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_images_isPublic"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_images_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "product_theme_backgrounds" DROP CONSTRAINT IF EXISTS "FK_product_theme_backgrounds_background_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_theme_backgrounds" DROP CONSTRAINT IF EXISTS "FK_product_theme_backgrounds_theme_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_type_themes" DROP CONSTRAINT IF EXISTS "FK_product_type_themes_product_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_type_themes" DROP CONSTRAINT IF EXISTS "FK_product_type_themes_theme_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_poses" DROP CONSTRAINT IF EXISTS "FK_product_poses_product_type_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_types" DROP CONSTRAINT IF EXISTS "FK_product_types_category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_industry_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "FK_user_subscriptions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_businesses" DROP CONSTRAINT IF EXISTS "FK_user_businesses_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT IF EXISTS "FK_user_addresses_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_userId"`,
    );
    await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_images_userId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "product_theme_backgrounds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_type_themes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_pose_backgrounds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_poses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_backgrounds"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_themes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "industries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_businesses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_addresses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "images"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS subscription_plan_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS business_segment_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS business_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum`);
  }
}
