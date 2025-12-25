import { Entity, Column, ManyToOne, ManyToMany, Index, JoinColumn, JoinTable } from 'typeorm';
import { ProductType } from './product-type.entity';
import { ProductBackground } from './product-background.entity';
import { BaseEntity } from './base.entity';

@Entity('product_poses')
export class ProductPose extends BaseEntity {
  @Index()
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'image_base64', type: 'text', nullable: true })
  imageBase64?: string; // Deprecated - kept for backward compatibility

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'text', nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToOne(() => ProductType, pt => pt.productPoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductType;

  @Column({ name: 'product_type_id' })
  productTypeId: string;

  @ManyToMany(() => ProductBackground, pb => pb.productPoses)
  @JoinTable({
    name: 'product_pose_backgrounds',
    joinColumn: { name: 'product_pose_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_background_id', referencedColumnName: 'id' },
  })
  productBackgrounds: ProductBackground[];
}
