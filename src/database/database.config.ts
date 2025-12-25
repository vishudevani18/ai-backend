import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Image } from './entities/image.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('app.database.host'),
  port: configService.get('app.database.port'),
  username: configService.get('app.database.username'),
  password: configService.get('app.database.password'),
  database: configService.get('app.database.database'),
  entities: [User, Image],
  synchronize: configService.get('app.nodeEnv') === 'development',
  logging: configService.get('app.nodeEnv') === 'development',
  // ✅ IMPORTANT: Cloud SQL Unix socket does NOT use SSL
  // SSL is handled automatically by Cloud SQL Proxy for Unix socket connections
  ssl: false,

  // Connection pooling configuration
  // Optimized for Cloud SQL db-f1-micro (limited to ~25 concurrent connections)
  extra: {
    // ✅ IMPORTANT: Disable SSL in extra config for Cloud SQL
    ssl: false,
    max: 10, // Maximum connections (reduced for db-f1-micro cost optimization)
    min: 2, // Minimum connections (reduced for cost savings)
    acquire: 30000, // Connection acquire timeout (30s)
    idle: 10000, // Connection idle timeout (10s)
    evict: 1000, // Connection eviction interval (1s)
    handleDisconnects: true,
    // Cloud SQL specific optimizations
    statement_timeout: 30000, // 30 second query timeout
  },

  // Query optimization - Redis cache (optional, only if Redis is configured)
  cache: (() => {
    const redisHost = configService.get('app.redis.host');
    if (redisHost && redisHost !== 'localhost' && redisHost !== '') {
      return {
        type: 'redis',
        options: {
          host: redisHost,
          port: configService.get('app.redis.port', 6379),
          password: configService.get('app.redis.password'),
          db: configService.get('app.redis.db', 0),
        },
        duration: 30000, // Cache duration in milliseconds
      };
    }
    // No cache if Redis is not configured
    return false;
  })(),

  // Performance optimizations
  maxQueryExecutionTime: 1000, // Log slow queries
  logger:
    configService.get('app.nodeEnv') === 'development' ? 'advanced-console' : 'simple-console',
});
