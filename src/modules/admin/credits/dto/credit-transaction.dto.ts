import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreditOperationType } from '../../../../database/entities/credit-transaction.entity';

export class CreditTransactionDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Transaction amount (positive for add, negative for deduct)' })
  amount: number;

  @ApiProperty({ description: 'Operation type', enum: CreditOperationType })
  operationType: CreditOperationType;

  @ApiPropertyOptional({ description: 'Transaction description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Related entity ID (e.g., generated_image_id)' })
  relatedEntityId?: string;

  @ApiProperty({ description: 'Balance before transaction' })
  balanceBefore: number;

  @ApiProperty({ description: 'Balance after transaction' })
  balanceAfter: number;

  @ApiProperty({ description: 'Transaction creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Transaction update date' })
  updatedAt: Date;
}

export class CreditTransactionFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by operation type', enum: CreditOperationType })
  operationType?: CreditOperationType;
}
