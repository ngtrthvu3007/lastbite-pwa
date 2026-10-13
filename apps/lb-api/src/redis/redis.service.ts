import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import { getRequiredEnv } from '../common/get-required-env';

const REDIS_CONNECT_TIMEOUT_MS = 2_000;

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client = this.createRedisClient(getRequiredEnv('REDIS_URL'));

  private createRedisClient(url: string) {
    const client = createClient({
      url,
      socket: {
        connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: false,
      },
    });

    client.on('error', (error: Error) => {
      this.logger.error(error.message);
    });

    return client;
  }

  async onModuleInit() {
    await this.client.connect();
  }

  onApplicationShutdown() {
    if (this.client.isOpen) this.client.destroy();
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  // node-redis v5 types the GETDEL reply loosely ({}); at runtime it returns a string or null.
  async getDel(key: string): Promise<string | null> {
    return (await this.client.getDel(key)) as string | null;
  }
}
