import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Industry } from './industry.entity';
import { ProductType } from './product-type.entity';
import { AiFace } from './ai-face.entity';
import { BaseEntity } from './base.entity';

@Entity('categories')
// FK index on industryId created automatically by TypeORM for JOINs
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToOne(() => Industry, industry => industry.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'industry_id' })
  industry: Industry;

  @Column({ name: 'industry_id', type: 'uuid' })
  industryId: string;

  @OneToMany(() => ProductType, pt => pt.category)
  productTypes: ProductType[];

  @OneToMany(() => AiFace, aiFace => aiFace.category)
  aiFaces: AiFace[];
}
