import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { ProductType } from './product-type.entity';
import { ProductBackground } from './product-background.entity';
import { BaseEntity } from './base.entity';

@Entity('product_themes')
export class ProductTheme extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string; // CDN URL from GCS

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
