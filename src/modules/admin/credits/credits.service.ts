import { Injectable } from '@nestjs/common';
import { CreditsService as BaseCreditsService } from '../../../modules/credits/credits.service';
import { CreditTransactionFilterDto } from './dto/credit-transaction.dto';

@Injectable()
export class AdminCreditsService {
  constructor(private readonly creditsService: BaseCreditsService) {}

  /**
   * Get all credit transactions with filters (admin only)
   */
  async getAllTransactions(filters: CreditTransactionFilterDto) {
    return this.creditsService.getAllTransactions({
      page: filters.page,
      limit: filters.limit,
      userId: filters.userId,
      operationType: filters.operationType,
    });
  }

  /**
   * Get user's credit transactions (admin only)
   */
  async getUserTransactions(userId: string, filters: CreditTransactionFilterDto) {
    return this.creditsService.getTransactionHistory(userId, {
      page: filters.page,
      limit: filters.limit,
      operationType: filters.operationType,
    });
  }

  /**
   * Get user's current credit balance (admin only)
   */
  async getUserBalance(userId: string) {
    const balance = await this.creditsService.checkBalance(userId);
    return { userId, balance };
  }
}
