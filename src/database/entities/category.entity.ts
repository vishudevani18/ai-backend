import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Industry } from './industry.entity';
import { ProductType } from './product-type.entity';
import { BaseEntity } from './base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // CDN URL from GCS

  @ManyToOne(() => Industry, industry => industry.categories, { onDelete: 'CASCADE' })
  industry: Industry;

  @Column({ name: 'industry_id' })
  industryId: string;

  @OneToMany(() => ProductType, pt => pt.category)
  productTypes: ProductType[];
}
