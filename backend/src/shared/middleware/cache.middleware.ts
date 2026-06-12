import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 3000,
        lazyConnect: true,
      });
      redis.on('error', (err) => {
        logger.warn('Redis connection error — caching disabled', { err: err.message });
        redis = null;
      });
    } catch {
      logger.warn('Redis initialization failed — caching disabled');
      redis = null;
    }
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 60): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, value);
  } catch {
    // silent
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch {
    // silent
  }
}

// Express middleware — caches GET responses
export function withCache(ttlSeconds = 60, keyFn?: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const cacheKey = keyFn ? keyFn(req) : `cache:${req.originalUrl}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(JSON.parse(cached));
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200 && body) {
        cacheSet(cacheKey, JSON.stringify(body), ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    res.setHeader('X-Cache', 'MISS');
    next();
  };
}
