import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AIService } from './ai.service';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        store: redisStore as any,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
        max: 100, // Maximum number of items in cache
      }),
    }),
  ],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
