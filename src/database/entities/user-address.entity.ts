import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_addresses')
@Index(['userId'])
@Index(['userId', 'addressType'])
export class UserAddress extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'address_type', length: 50, default: 'default' })
  addressType: string;

  @Column({ name: 'street', length: 255, nullable: true })
  street?: string;

  @Column({ name: 'city', length: 100, nullable: true })
  city?: string;

  @Column({ name: 'state', length: 100, nullable: true })
  state?: string;

  @Column({ name: 'zipcode', length: 20, nullable: true })
  zipcode?: string;

  @Column({ name: 'country', length: 100, default: 'India' })
  country: string;

  @ManyToOne(() => User, user => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
