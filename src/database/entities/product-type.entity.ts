import { Entity, Column, ManyToOne, ManyToMany, OneToMany, Index, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductTheme } from './product-theme.entity';
import { BaseEntity } from './base.entity';
import { ProductPose } from './product-pose.entity';

@Entity('product_types')
export class ProductType extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToOne(() => Category, category => category.productTypes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'uuid', nullable: false })
  categoryId: string;

  @ManyToMany(() => ProductTheme, pt => pt.productTypes)
  productThemes: ProductTheme[];

  @OneToMany(() => ProductPose, pose => pose.productType)
  productPoses: ProductPose[];
}
