import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageCleanupSubscriber } from './subscribers/image-cleanup.subscriber';
import { GeneratedImageCleanupSubscriber } from './subscribers/generated-image-cleanup.subscriber';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('app.database.host');
        const isCloudSql = host && host.startsWith('/cloudsql/');

        // Get database config with fallbacks
        const database =
          configService.get('app.database.database') || process.env.DB_DATABASE || 'dev_db';
        const username = configService.get('app.database.username') || process.env.DB_USERNAME;
        const password = configService.get('app.database.password') || process.env.DB_PASSWORD;

        return {
          type: 'postgres',
          host: host,
          port: configService.get('app.database.port'),
          username: username,
          password: password,
          database: database,
          /**
           * ✅ Automatically load all entities (from dist or src)
           */
          autoLoadEntities: true,
          /**
           * ✅ synchronize is enabled for fresh database start
           * TypeORM will automatically create/update tables based on entities
           * Set to false when you're ready to use migrations
           */
          synchronize: configService.get('app.nodeEnv') !== 'production',
          logging: configService.get('app.nodeEnv') === 'development',
          // ✅ IMPORTANT: Cloud SQL Unix socket does NOT use SSL
          ssl: false,
          extra: {
            // ✅ IMPORTANT: Disable SSL in extra config for Cloud SQL
            ssl: false,
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
            handleDisconnects: true,
            statement_timeout: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    StorageModule,
  ],
  providers: [ImageCleanupSubscriber, GeneratedImageCleanupSubscriber],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
