import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Database
import { DatabaseModule } from './database/database.module';

// Common
import { CommonModule } from './common/common.module';

// (Removed non-essential infrastructure modules)

// Security
import { SecurityModule } from './security/security.module';

// (Removed domain/configuration/infrastructure modules for minimal core)

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
// (Removed non-essential feature modules)
import { HealthModule } from './modules/health/health.module';

// Use simple HTTP exception filter for minimal stack
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminModule } from './modules/admin/admin.module';
import { WebAppModule } from './modules/webapp/webapp.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: [`env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
            limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
          },
        ],
      }),
    }),

    // Core modules only
    DatabaseModule,
    SecurityModule,

    // Common utilities
    CommonModule,

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    AdminModule,
    WebAppModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
