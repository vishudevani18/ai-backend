import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ContactFormStatus {
  NEW = 'new',
  READ = 'read',
  REPLIED = 'replied',
  ARCHIVED = 'archived',
}

@Entity('contact_forms')
@Index(['status', 'createdAt']) // Composite for admin filtering (most common query)
@Index(['email', 'createdAt']) // Composite for email search with date sorting
export class ContactForm extends BaseEntity {
  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'email', length: 150, nullable: false })
  email: string; // NOT NULL - required field

  @Column({ name: 'phone', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'subject', length: 200 })
  subject: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ContactFormStatus,
    default: ContactFormStatus.NEW,
  })
  status: ContactFormStatus;

  @Column({ name: 'read_at', type: 'timestamp with time zone', nullable: true })
  readAt?: Date;

  @Column({ name: 'read_by', type: 'uuid', nullable: true })
  readBy?: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 1000, nullable: true })
  userAgent?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'read_by' })
  readByUser?: User; // FK constraint: SET NULL if admin user is deleted
}
