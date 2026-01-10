import { Entity, Column, ManyToOne, ManyToMany, Index, JoinColumn, JoinTable } from 'typeorm';
import { ProductType } from './product-type.entity';
import { ProductBackground } from './product-background.entity';
import { BaseEntity } from './base.entity';

@Entity('product_poses')
// FK index on productTypeId created automatically by TypeORM for JOINs
export class ProductPose extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToOne(() => ProductType, pt => pt.productPoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductType;

  @Column({ name: 'product_type_id', type: 'uuid' })
  productTypeId: string;

  @ManyToMany(() => ProductBackground, pb => pb.productPoses)
  @JoinTable({
    name: 'product_pose_backgrounds',
    joinColumn: { name: 'product_pose_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_background_id', referencedColumnName: 'id' },
  })
  productBackgrounds: ProductBackground[];
}
