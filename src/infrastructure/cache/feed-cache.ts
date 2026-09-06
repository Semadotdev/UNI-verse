import type { PaginatedResult } from '@/domain/types/api';
import type { Post } from '@/domain/entities/post';

export interface FeedFilter {
  username?: string;
  feed?: string;
}

const FEED_CACHE_TTL_MS = 20 * 1000;
const feedCache = new Map<string, { expiresAt: number; value: PaginatedResult<Post> }>();

export function feedCacheKey(
  userId: string,
  page: number,
  limit: number,
  filter?: FeedFilter
): string {
  return `${userId}:${filter?.username ?? ''}:${filter?.feed ?? ''}:${page}:${limit}`;
}

export function getCachedFeed(key: string): PaginatedResult<Post> | undefined {
  const cached = feedCache.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    feedCache.delete(key);
    return undefined;
  }
  return cached.value;
}

export function setCachedFeed(key: string, value: PaginatedResult<Post>): void {
  feedCache.set(key, { expiresAt: Date.now() + FEED_CACHE_TTL_MS, value });
}

export function invalidateFeedCache(): void {
  feedCache.clear();
}

export function resetFeedCache(): void {
  feedCache.clear();
}