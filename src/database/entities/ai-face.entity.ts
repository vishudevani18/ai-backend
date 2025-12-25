import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { BaseEntity } from './base.entity';

export enum AiFaceGender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('ai_faces')
export class AiFace extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({
    type: 'enum',
    enum: AiFaceGender,
    name: 'gender',
  })
  gender: AiFaceGender;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToOne(() => Category, category => category.productTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: string;
}

