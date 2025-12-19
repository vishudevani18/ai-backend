import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { ValidationService } from './services/validation.service';
import { ApiSecurityService } from './services/api-security.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [ValidationService, ApiSecurityService, RateLimitGuard, ApiKeyGuard],
  exports: [ValidationService, ApiSecurityService, RateLimitGuard, ApiKeyGuard],
})
export class SecurityModule {}
