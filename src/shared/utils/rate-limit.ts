import type { NextRequest } from 'next/server';
import { RateLimiter, type RateLimitResult } from '@/shared/utils/rate-limiter';
import { errorResponse } from '@/domain/types/api';

export type RateLimitKeyType = 'ip' | 'user';

const CACHE = new Map<string, RateLimiter>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function getScopedRateLimiter(scope: string, windowMs: number, maxRequests: number): RateLimiter {
  const cacheKey = `${scope}:${windowMs}:${maxRequests}`;
  const cached = CACHE.get(cacheKey);
  if (cached) return cached;
  const instance = new RateLimiter(windowMs, maxRequests);
  CACHE.set(cacheKey, instance);
  return instance;
}

export interface RateLimitOutcome {
  response?: Response;
  headers: Record<string, string>;
  result: RateLimitResult;
}

export async function enforceRateLimit(
  request: NextRequest,
  scope: string,
  windowMs: number,
  maxRequests: number,
  keyType: RateLimitKeyType,
  suffix: string
): Promise<RateLimitOutcome> {
  const limiter = getScopedRateLimiter(scope, windowMs, maxRequests);
  const identifier = keyType === 'user' ? suffix : `${getClientIp(request)}:${suffix}`;
  const key = `${scope}:${identifier}`;
  const result = await limiter.isAllowed(key);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };

  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    const response = Response.json(errorResponse('RATE_LIMITED', 'Too many requests, please try again later'), {
      status: 429,
      headers: { ...headers, 'Retry-After': String(retryAfter) },
    });
    return { response, headers, result };
  }

  return { headers, result };
}
