import { Module } from '@nestjs/common';
import { CreditsModule } from '../../../modules/credits/credits.module';
import { AdminCreditsController } from './credits.controller';
import { AdminCreditsService } from './credits.service';

@Module({
  imports: [CreditsModule],
  controllers: [AdminCreditsController],
  providers: [AdminCreditsService],
})
export class AdminCreditsModule {}
