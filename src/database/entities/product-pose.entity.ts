import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ProductType } from './product-type.entity';
import { ProductBackground } from './product-background.entity';
import { BaseEntity } from './base.entity';

@Entity('product_poses')
export class ProductPose extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToMany(() => ProductType, pt => pt.productPoses)
  @JoinTable({
    name: 'product_pose_types',
    joinColumn: { name: 'product_pose_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_type_id', referencedColumnName: 'id' },
  })
  productTypes: ProductType[];

  @ManyToMany(() => ProductBackground, pb => pb.productPoses)
  @JoinTable({
    name: 'product_pose_backgrounds',
    joinColumn: { name: 'product_pose_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_background_id', referencedColumnName: 'id' },
  })
  productBackgrounds: ProductBackground[];
}
