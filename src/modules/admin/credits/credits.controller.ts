import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { AdminCreditsService } from './credits.service';
import { CreditsService } from '../../../modules/credits/credits.service';
import { CreditOperationType } from '../../../database/entities/credit-transaction.entity';
import { CreditTransactionFilterDto } from './dto/credit-transaction.dto';
import { AdjustCreditsDto } from './dto/adjust-credits.dto';
import { ResponseUtil } from '../../../common/utils/response.util';

@ApiTags('2. Admin - Credit Management')
@Controller('admin/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminCreditsController {
  constructor(
    private readonly adminCreditsService: AdminCreditsService,
    private readonly creditsService: CreditsService,
  ) {}

  @Get('transactions')
  @ApiOperation({
    summary: 'Get all credit transactions with filters (Admin/Super Admin only)',
    description:
      'Get all credit transactions across all users. Supports pagination and filtering by userId and operationType.',
  })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getAllTransactions(@Query() filters: CreditTransactionFilterDto) {
    const { transactions, total } = await this.adminCreditsService.getAllTransactions(filters);
    return ResponseUtil.paginated(
      transactions,
      filters.page || 1,
      filters.limit || 20,
      total,
      'Transactions retrieved successfully',
    );
  }

  @Get('users/:userId/transactions')
  @ApiOperation({
    summary: 'Get credit transactions for a specific user (Admin/Super Admin only)',
    description: 'Get credit transaction history for a specific user with pagination and filtering.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query() filters: CreditTransactionFilterDto,
  ) {
    const { transactions, total } = await this.adminCreditsService.getUserTransactions(
      userId,
      filters,
    );
    return ResponseUtil.paginated(
      transactions,
      filters.page || 1,
      filters.limit || 20,
      total,
      'User transactions retrieved successfully',
    );
  }

  @Get('users/:userId/balance')
  @ApiOperation({
    summary: 'Get user credit balance (Admin/Super Admin only)',
    description: 'Get the current credit balance for a specific user.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserBalance(@Param('userId') userId: string) {
    const balance = await this.adminCreditsService.getUserBalance(userId);
    return ResponseUtil.success(balance, 'User balance retrieved successfully');
  }

  @Patch('users/:userId/adjust')
  @ApiOperation({
    summary: 'Manually adjust user credits (Admin/Super Admin only)',
    description:
      'Add or deduct credits for a user. Use positive amount to add, negative to deduct. Logs as ADMIN_ADJUSTMENT.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: AdjustCreditsDto })
  @ApiResponse({ status: 200, description: 'Credits adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid amount or insufficient credits' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adjustCredits(
    @Param('userId') userId: string,
    @Body() adjustCreditsDto: AdjustCreditsDto,
  ) {
    const { amount, reason } = adjustCreditsDto;

    if (amount > 0) {
      // Add credits
      const transaction = await this.creditsService.addCredits(
        userId,
        amount,
        CreditOperationType.ADMIN_ADJUSTMENT,
        `Admin adjustment: ${reason}`,
      );
      return ResponseUtil.success(transaction, 'Credits added successfully');
    } else if (amount < 0) {
      // Deduct credits (use absolute value)
      const transaction = await this.creditsService.deductCreditsOrFail(
        userId,
        Math.abs(amount),
        CreditOperationType.ADMIN_ADJUSTMENT,
        `Admin adjustment: ${reason}`,
      );
      return ResponseUtil.success(transaction, 'Credits deducted successfully');
    } else {
      return ResponseUtil.success(null, 'No adjustment needed (amount is 0)');
    }
  }
}

