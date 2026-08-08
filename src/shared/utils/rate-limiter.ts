import { prisma } from '@/infrastructure/database/prisma-client';

const PRUNE_PROBABILITY = 0.05;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
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

    const [rateLimitBucket, staleCount] = await prisma.$transaction([
      prisma.rateLimitBucket.upsert({
        where: { key: bucketKey },
        create: { key: bucketKey, count: 1, resetAt: new Date(resetAt) },
        update: { count: { increment: 1 } },
      }),
      prisma.rateLimitBucket.count({
        where: { resetAt: { lt: new Date(now) } },
      }),
    ]);

    if (staleCount > 0 && Math.random() < PRUNE_PROBABILITY) {
      await prisma.rateLimitBucket.deleteMany({
        where: { resetAt: { lt: new Date(now) } },
      });
    }

    const remaining = Math.max(0, this.maxRequests - rateLimitBucket.count);
    return {
      allowed: rateLimitBucket.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      resetAt,
    };
  }

  async getRemaining(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!bucket) return this.maxRequests;
    return Math.max(0, this.maxRequests - bucket.count);
  }

  async getResetMs(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!bucket) return 0;
    return Math.max(0, bucket.resetAt.getTime() - now);
  }
}
