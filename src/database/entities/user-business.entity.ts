import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum BusinessType {
  MANUFACTURER = 'manufacturer',
  RESELLER = 'reseller',
  WHOLESALER = 'wholesaler',
  OTHER = 'other',
}

export enum BusinessSegment {
  CLOTHING = 'clothing',
  ACCESSORIES = 'accessories',
  FURNITURE = 'furniture',
  ELECTRONICS = 'electronics',
  OTHER = 'other',
}

@Entity('user_businesses')
export class UserBusiness extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ name: 'business_name', length: 150, nullable: true })
  businessName?: string;

  @Column({
    name: 'business_type',
    type: 'enum',
    enum: BusinessType,
    nullable: true,
  })
  businessType?: BusinessType;

  @Column({
    name: 'business_segment',
    type: 'enum',
    enum: BusinessSegment,
    nullable: true,
  })
  businessSegment?: BusinessSegment;

  @Column({ name: 'business_description', type: 'text', nullable: true })
  businessDescription?: string;

  @Column({ name: 'gst_number', length: 20, nullable: true })
  gstNumber?: string;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl?: string;

  @Column({ name: 'business_logo', type: 'text', nullable: true })
  businessLogo?: string;

  @OneToOne(() => User, user => user.business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
