import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

const REDIS_CONNECT_TIMEOUT_MS = 2_000;

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client = this.createRedisClient(this.getRedisUrl());

  async onModuleInit() {
    await this.client.connect();
  }

  onApplicationShutdown() {
    if (this.client.isOpen) this.client.destroy();
  }

  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  // node-redis v5 types GET/GETDEL replies loosely ({}); at runtime they return a string or null.
  async get(key: string): Promise<string | null> {
    return (await this.client.get(key)) as string | null;
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async getDel(key: string): Promise<string | null> {
    return (await this.client.getDel(key)) as string | null;
  }

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

  private getRedisUrl(): string {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('Missing required environment variable: REDIS_URL');

    return url;
  }
}
