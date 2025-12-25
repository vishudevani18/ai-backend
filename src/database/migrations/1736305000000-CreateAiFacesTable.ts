import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAiFacesTable1736305000000 implements MigrationInterface {
  name = 'CreateAiFacesTable1736305000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ai_faces',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'enum',
            enum: ['male', 'female'],
          },
          {
            name: 'image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_path',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'ai_faces',
      new TableIndex({
        name: 'IDX_ai_faces_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'ai_faces',
      new TableIndex({
        name: 'IDX_ai_faces_category_gender',
        columnNames: ['category_id', 'gender'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'ai_faces',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'CASCADE',
        name: 'FK_ai_faces_category',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('ai_faces');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.name === 'FK_ai_faces_category');
      if (foreignKey) {
        await queryRunner.dropForeignKey('ai_faces', foreignKey);
      }
    }

    await queryRunner.dropIndex('ai_faces', 'IDX_ai_faces_category_gender');
    await queryRunner.dropIndex('ai_faces', 'IDX_ai_faces_name');
    await queryRunner.dropTable('ai_faces');
  }
}

