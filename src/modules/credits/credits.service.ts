import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { CreditTransaction, CreditOperationType } from '../../database/entities/credit-transaction.entity';
import { BusinessError, ErrorCode } from '../../common/errors/business.error';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
    private dataSource: DataSource,
  ) {}

  /**
   * Get current credit balance for a user
   */
  async checkBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'credits'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.credits;
  }

  /**
   * Check if user has enough credits (internal use only)
   */
  private async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.checkBalance(userId);
    return balance >= requiredCredits;
  }

  /**
   * Deduct credits with transaction log
   * Throws InsufficientCreditsException if not enough credits
   * Public API - use this instead of hasEnoughCredits + deductCredits
   */
  async deductCreditsOrFail(
    userId: string,
    amount: number,
    operationType: CreditOperationType,
    description: string,
    relatedEntityId?: string,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Credit deduction amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Use database transaction to prevent race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user row for update
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const balanceBefore = user.credits;

      // Check if user has enough credits
      if (balanceBefore < amount) {
        throw new BusinessError(
          ErrorCode.INSUFFICIENT_CREDITS,
          `Insufficient credits. You need ${amount} credits but have ${balanceBefore} credits.`,
          HttpStatus.BAD_REQUEST,
          {
            userId,
            required: amount,
            available: balanceBefore,
          },
        );
      }

      // Deduct credits
      const balanceAfter = balanceBefore - amount;
      user.credits = balanceAfter;
      await queryRunner.manager.save(User, user);

      // Create transaction log
      const transaction = queryRunner.manager.create(CreditTransaction, {
        userId,
        amount: -amount, // Negative for deduction
        operationType,
        description,
        relatedEntityId,
        balanceBefore,
        balanceAfter,
      });

      const savedTransaction = await queryRunner.manager.save(CreditTransaction, transaction);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Credits deducted: User ${userId}, Amount: ${amount}, Balance: ${balanceBefore} -> ${balanceAfter}`,
      );

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Add credits with transaction log
   */
  async addCredits(
    userId: string,
    amount: number,
    operationType: CreditOperationType,
    description: string,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new BusinessError(
        ErrorCode.VALIDATION_ERROR,
        'Credit addition amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Use database transaction to prevent race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user row for update
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const balanceBefore = user.credits;
      const balanceAfter = balanceBefore + amount;

      // Add credits
      user.credits = balanceAfter;
      await queryRunner.manager.save(User, user);

      // Create transaction log
      const transaction = queryRunner.manager.create(CreditTransaction, {
        userId,
        amount, // Positive for addition
        operationType,
        description,
        balanceBefore,
        balanceAfter,
      });

      const savedTransaction = await queryRunner.manager.save(CreditTransaction, transaction);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Credits added: User ${userId}, Amount: ${amount}, Balance: ${balanceBefore} -> ${balanceAfter}`,
      );

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(
    userId: string,
    filters?: { page?: number; limit?: number; operationType?: CreditOperationType },
  ): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.creditTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC'); // Partition-ready: ORDER BY created_at enables partition pruning
    // Note: TypeORM automatically excludes soft-deleted records

    if (filters?.operationType) {
      queryBuilder.andWhere('transaction.operationType = :operationType', {
        operationType: filters.operationType,
      });
    }

    const [transactions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  /**
   * Get all credit transactions (admin only)
   */
  async getAllTransactions(filters?: {
    page?: number;
    limit?: number;
    userId?: string;
    operationType?: CreditOperationType;
  }): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.creditTransactionRepository
      .createQueryBuilder('transaction')
      .orderBy('transaction.createdAt', 'DESC'); // Partition-ready: ORDER BY created_at enables partition pruning
    // Note: TypeORM automatically excludes soft-deleted records

    if (filters?.userId) {
      queryBuilder.andWhere('transaction.userId = :userId', { userId: filters.userId });
    }

    if (filters?.operationType) {
      queryBuilder.andWhere('transaction.operationType = :operationType', {
        operationType: filters.operationType,
      });
    }

    const [transactions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }
}

