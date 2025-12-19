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
  ssl: configService.get('app.nodeEnv') === 'production' ? { rejectUnauthorized: false } : false,

  // Connection pooling configuration
  extra: {
    max: 20, // Maximum connections
    min: 5, // Minimum connections
    acquire: 30000, // Connection acquire timeout
    idle: 10000, // Connection idle timeout
    evict: 1000, // Connection eviction interval
    handleDisconnects: true,
  },

  // Query optimization
  cache: {
    type: 'redis',
    options: {
      host: configService.get('app.redis.host', 'localhost'),
      port: configService.get('app.redis.port', 6379),
      password: configService.get('app.redis.password'),
      db: configService.get('app.redis.db', 0),
    },
    duration: 30000, // Cache duration in milliseconds
  },

  // Performance optimizations
  maxQueryExecutionTime: 1000, // Log slow queries
  logger:
    configService.get('app.nodeEnv') === 'development' ? 'advanced-console' : 'simple-console',
});
