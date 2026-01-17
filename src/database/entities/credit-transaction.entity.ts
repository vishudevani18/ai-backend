import { Entity, Column, Index, Check } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum CreditOperationType {
  SIGNUP_BONUS = 'signup_bonus',
  IMAGE_GENERATION = 'image_generation',
  BULK_GENERATION = 'bulk_generation',
  FACE_SWAP = 'face_swap',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  REFUND = 'refund',
}

@Entity('credit_transactions')
@Index('IDX_credit_transactions_user_created', ['userId', 'createdAt']) // Most common query: user history
@Index('IDX_credit_transactions_operation_type', ['operationType']) // Admin filtering by operation type
@Check(`"balance_after" = "balance_before" + "amount"`)
export class CreditTransaction extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // Indexed in composite index above

  @Column({ name: 'amount', type: 'integer' })
  amount: number; // Positive for add, negative for deduct

  @Column({
    name: 'operation_type',
    type: 'enum',
    enum: CreditOperationType,
  })
  operationType: CreditOperationType;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId?: string; // e.g., generated_image_id - rarely queried, no index needed

  @Column({ name: 'balance_before', type: 'integer' })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'integer' })
  balanceAfter: number;
}
