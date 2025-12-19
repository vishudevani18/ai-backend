import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneUniqueConstraint1735689600000 implements MigrationInterface {
  name = 'AddPhoneUniqueConstraint1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any NULL phone numbers to a temporary value to avoid constraint issues
    // This is a data migration step - adjust based on your needs
    await queryRunner.query(`
      UPDATE users 
      SET phone = CONCAT('+91', FLOOR(RANDOM() * 9000000000 + 1000000000)::text)
      WHERE phone IS NULL;
    `);

    // Add unique constraint to phone column
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_phone" ON "users" ("phone");
    `);

    // Make phone NOT NULL
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "phone" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove NOT NULL constraint
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "phone" DROP NOT NULL;
    `);

    // Drop unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_users_phone";
    `);
  }
}
