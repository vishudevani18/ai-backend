import { Entity, Column, Index, Check, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Industry } from './industry.entity';
import { Category } from './category.entity';
import { ProductType } from './product-type.entity';
import { ProductPose } from './product-pose.entity';
import { ProductTheme } from './product-theme.entity';
import { ProductBackground } from './product-background.entity';
import { AiFace } from './ai-face.entity';

export enum GenerationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum GenerationType {
  SINGLE = 'single',
  BULK = 'bulk',
}

@Entity('generated_images')
@Index(['userId', 'generationStatus'], { where: 'user_id IS NOT NULL' })
@Index(['userId', 'createdAt'], { where: 'user_id IS NOT NULL' }) // For user history queries and partition pruning
@Index(['expiresAt']) // Index for cleanup queries (expired images filtering handled in application code)
@Index(['generationType', 'generationStatus', 'createdAt']) // Partition-ready: includes createdAt
@Check(`"expires_at" IS NULL OR "expires_at" > "created_at"`)
@Check(`"generation_time_ms" IS NULL OR "generation_time_ms" >= 0`)
export class GeneratedImage extends BaseEntity {
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string; // Optional, for future user tracking

  // FK relationships to admin tables - RESTRICT prevents deletion if images exist
  @ManyToOne(() => Industry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'industry_id' })
  industry: Industry;

  @Column({ name: 'industry_id', type: 'uuid' })
  industryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => ProductType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductType;

  @Column({ name: 'product_type_id', type: 'uuid' })
  productTypeId: string;

  @ManyToOne(() => ProductPose, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_pose_id' })
  productPose: ProductPose;

  @Column({ name: 'product_pose_id', type: 'uuid' })
  productPoseId: string;

  @ManyToOne(() => ProductTheme, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_theme_id' })
  productTheme: ProductTheme;

  @Column({ name: 'product_theme_id', type: 'uuid' })
  productThemeId: string;

  @ManyToOne(() => ProductBackground, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_background_id' })
  productBackground: ProductBackground;

  @Column({ name: 'product_background_id', type: 'uuid' })
  productBackgroundId: string;

  @ManyToOne(() => AiFace, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ai_face_id' })
  aiFace: AiFace;

  @Column({ name: 'ai_face_id', type: 'uuid' })
  aiFaceId: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string; // GCS CDN URL (may be null after deletion)

  @Column({ name: 'image_path', type: 'varchar', length: 500, nullable: true })
  imagePath?: string; // GCS path for deletion

  @Column({
    name: 'generation_status',
    type: 'enum',
    enum: GenerationStatus,
    default: GenerationStatus.SUCCESS,
  })
  generationStatus: GenerationStatus; // Indexed in composite index above

  @Column({ name: 'error_message', type: 'varchar', length: 1000, nullable: true })
  errorMessage?: string; // For failed generations

  @Column({ name: 'generation_time_ms', type: 'integer', nullable: true })
  generationTimeMs?: number; // Performance tracking

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date; // 6 hours from creation - indexed above for cleanup queries

  @Column({
    name: 'generation_type',
    type: 'enum',
    enum: GenerationType,
    default: GenerationType.SINGLE,
  })
  generationType: GenerationType; // Indexed in composite index above
}
