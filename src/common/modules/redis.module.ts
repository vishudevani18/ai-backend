import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get('app.redis.host');
        const redisPort = configService.get('app.redis.port', 6379);
        const logger = new Logger('RedisModule');

        // If Redis is not configured, return a mock client that does nothing
        if (!redisHost || redisHost === 'localhost' || redisHost === '') {
          logger.warn('Redis not configured - OTP and caching features will be disabled');
          // Return a mock Redis client that implements basic methods
          // This allows the app to run without Redis, but OTP won't persist
          const mockClient = {
            get: async () => null,
            set: async () => 'OK',
            setex: async () => 'OK',
            del: async () => 0,
            incr: async () => 1,
            expire: async () => 0,
            ttl: async () => -1,
            quit: async () => 'OK',
            disconnect: async () => {},
            on: () => mockClient,
            off: () => mockClient,
            connect: async () => {},
            status: 'end',
          };
          return mockClient as unknown as Redis;
        }

        // Redis is configured, create real connection
        logger.log(`Connecting to Redis at ${redisHost}:${redisPort}`);
        return new Redis({
          host: redisHost,
          port: redisPort,
          password: configService.get('app.redis.password'),
          db: configService.get('app.redis.db', 0),
          retryStrategy: times => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true, // Don't connect immediately
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
