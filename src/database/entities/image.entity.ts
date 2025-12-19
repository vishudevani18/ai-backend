import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('images')
export class Image extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  prompt: string;

  @Column()
  filePath: string;

  @Column()
  fileName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ default: false })
  isPublic: boolean;

  @Column()
  userId: string;
}
