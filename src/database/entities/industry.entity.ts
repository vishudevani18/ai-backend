import { Entity, Column, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { BaseEntity } from './base.entity';

@Entity('industries')
export class Industry extends BaseEntity {
  @Column({ unique: true, type: 'varchar', length: 255 })
  name: string; // Unique constraint automatically creates index

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @OneToMany(() => Category, category => category.industry)
  categories: Category[];
}
