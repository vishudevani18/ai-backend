import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { CreditTransaction } from '../../database/entities/credit-transaction.entity';
import { CreditsService } from './credits.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, CreditTransaction])],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}

