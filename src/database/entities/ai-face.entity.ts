import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { BaseEntity } from './base.entity';

export enum AiFaceGender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('ai_faces')
// FK index on categoryId created automatically by TypeORM for JOINs
// Small table (< 100 faces) - sequential scans are fast, no additional indexes needed
export class AiFace extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({
    type: 'enum',
    enum: AiFaceGender,
    name: 'gender',
  })
  gender: AiFaceGender;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToOne(() => Category, category => category.aiFaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;
}
