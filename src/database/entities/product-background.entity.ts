import { Entity, Column, ManyToMany } from 'typeorm';
import { ProductTheme } from './product-theme.entity';
import { ProductPose } from './product-pose.entity';
import { BaseEntity } from './base.entity';

@Entity('product_backgrounds')
export class ProductBackground extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string; // No WHERE queries on name, small table - no index needed

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToMany(() => ProductTheme, pt => pt.productBackgrounds)
  productThemes: ProductTheme[];

  @ManyToMany(() => ProductPose, pose => pose.productBackgrounds)
  productPoses: ProductPose[];
}
