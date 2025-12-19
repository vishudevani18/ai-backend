import { Entity, Column, OneToMany, Index } from 'typeorm';
import { Category } from './category.entity';
import { BaseEntity } from './base.entity';

@Entity('industries')
export class Industry extends BaseEntity {
  @Index()
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @OneToMany(() => Category, category => category.industry)
  categories: Category[];
}
