import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class CacheService {
  private client: RedisClientType | null = null;
  private enabled = false;

  async connect() {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not set — cache disabled');
      return;
    }
    try {
      this.client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
      this.client.on('error', (err) => logger.error('Redis error', { err }));
      await this.client.connect();
      this.enabled = true;
      logger.info('Redis connected');
    } catch (err) {
      logger.warn('Redis connection failed — cache disabled', { err });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) return null;
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds = 300) {
    if (!this.enabled || !this.client) return;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string) {
    if (!this.enabled || !this.client) return;
    await this.client.del(key);
  }

  async delPattern(pattern: string) {
    if (!this.enabled || !this.client) return;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(keys);
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

export const cacheService = new CacheService();
