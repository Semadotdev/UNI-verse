import { prisma } from '@/infrastructure/database/prisma-client';

const PRUNE_PROBABILITY = 0.05;
const SYNC_PROBABILITY = 0.01;
const MAX_MEMORY_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

export function resetRateLimiter(): void {
  memoryBuckets.clear();
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const resetAt = (Math.floor(now / this.windowMs) + 1) * this.windowMs;

    let bucket = memoryBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt };
      memoryBuckets.set(bucketKey, bucket);
      if (memoryBuckets.size > MAX_MEMORY_KEYS) {
        const oldest = memoryBuckets.keys().next().value;
        if (oldest !== undefined) {
          memoryBuckets.delete(oldest);
        }
      }
    }
    bucket.count += 1;

    if (Math.random() < SYNC_PROBABILITY) {
      await this.syncToDb(bucketKey, bucket);
    }

    const remaining = Math.max(0, this.maxRequests - bucket.count);
    return {
      allowed: bucket.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      resetAt,
    };
  }

  private async syncToDb(bucketKey: string, bucket: MemoryBucket): Promise<void> {
    try {
      await prisma.rateLimitBucket.upsert({
        where: { key: bucketKey },
        create: { key: bucketKey, count: bucket.count, resetAt: new Date(bucket.resetAt) },
        update: { count: bucket.count },
      });
      if (Math.random() < PRUNE_PROBABILITY) {
        await prisma.rateLimitBucket.deleteMany({
          where: { resetAt: { lt: new Date() } },
        });
      }
    } catch {
      // best effort
    }
  }

  async getRemaining(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = memoryBuckets.get(bucketKey);
    if (bucket && bucket.resetAt > now) {
      return Math.max(0, this.maxRequests - bucket.count);
    }
    const dbBucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!dbBucket) return this.maxRequests;
    return Math.max(0, this.maxRequests - dbBucket.count);
  }

  async getResetMs(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = memoryBuckets.get(bucketKey);
    if (bucket && bucket.resetAt > now) {
      return Math.max(0, bucket.resetAt - now);
    }
    const dbBucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!dbBucket) return 0;
    return Math.max(0, dbBucket.resetAt.getTime() - now);
  }
}