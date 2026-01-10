import { Entity, Column, ManyToMany, Index, JoinTable } from 'typeorm';
import { ProductType } from './product-type.entity';
import { ProductBackground } from './product-background.entity';
import { BaseEntity } from './base.entity';

@Entity('product_themes')
export class ProductTheme extends BaseEntity {
  @Column({ unique: true, type: 'varchar', length: 255 })
  name: string; // Unique constraint automatically creates index

  @Column({ nullable: true, type: 'varchar', length: 1000 })
  description?: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // Public CDN URL from GCS

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @ManyToMany(() => ProductType, pt => pt.productThemes)
  @JoinTable({
    name: 'product_type_themes',
    joinColumn: { name: 'theme_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_type_id', referencedColumnName: 'id' },
  })
  productTypes: ProductType[];

  @ManyToMany(() => ProductBackground, pb => pb.productThemes)
  @JoinTable({
    name: 'product_theme_backgrounds',
    joinColumn: { name: 'product_theme_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_background_id', referencedColumnName: 'id' },
  })
  productBackgrounds: ProductBackground[];
}
