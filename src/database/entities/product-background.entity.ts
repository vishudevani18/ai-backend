import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { ProductTheme } from './product-theme.entity';
import { ProductPose } from './product-pose.entity';
import { BaseEntity } from './base.entity';

@Entity('product_backgrounds')
export class ProductBackground extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'image_base64', type: 'text', nullable: true })
  imageBase64?: string; // Deprecated - kept for backward compatibility

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // CDN URL from GCS

  @ManyToMany(() => ProductTheme, pt => pt.productBackgrounds)
  productThemes: ProductTheme[];

  @ManyToMany(() => ProductPose, pose => pose.productBackgrounds)
  productPoses: ProductPose[];
}
