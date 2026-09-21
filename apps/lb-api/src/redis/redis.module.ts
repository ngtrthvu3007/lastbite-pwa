import {
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private client = this.createClient();
  private connectionPromise?: Promise<void>;

  constructor() {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing required environment variable: REDIS_URL');
    }

  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureConnected();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Redis unavailable; using Postgres only: ${message}`);
    }
  }

  onApplicationShutdown(): void {
    if (this.client.isOpen) {
      this.client.destroy();
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.ensureConnected();
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  private createClient() {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 2_000,
        reconnectStrategy: false,
      },
    });

    client.on('error', (error: Error) => {
      this.logger.error(error.message);
    });

    return client;
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isReady) return;

    // Share one connection attempt between concurrent session writes.
    if (!this.connectionPromise) {
      this.connectionPromise = this.client
        .connect()
        .then(() => undefined)
        .catch((error: unknown) => {
          if (this.client.isOpen) {
            this.client.destroy();
          }

          // A failed node-redis client cannot be reused reliably. Keep a fresh,
          // disconnected client so a later cache write can recover without an
          // application restart.
          this.client = this.createClient();
          throw error;
        })
        .finally(() => {
          this.connectionPromise = undefined;
        });
    }

    await this.connectionPromise;
  }
  async getDel(key: string): Promise<string | null> {
    await this.ensureConnected();
    const value = await this.client.getDel(key);
    return typeof value === 'string' ? value : null;
  }
}

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
