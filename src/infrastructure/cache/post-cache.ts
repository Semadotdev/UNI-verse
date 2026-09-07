const POST_CACHE_TTL_MS = 30 * 1000;
const MAX_POST_CACHE_ENTRIES = 500;

const postCache = new Map<string, { expiresAt: number; value: unknown }>();

export function getCachedPost(key: string): unknown | undefined {
  const cached = postCache.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    postCache.delete(key);
    return undefined;
  }
  return cached.value;
}

export function setCachedPost(key: string, value: unknown): void {
  if (postCache.size >= MAX_POST_CACHE_ENTRIES) {
    const oldest = postCache.keys().next().value;
    if (oldest !== undefined) postCache.delete(oldest);
  }
  postCache.set(key, { expiresAt: Date.now() + POST_CACHE_TTL_MS, value });
}

export function invalidatePostCache(key: string): void {
  postCache.delete(key);
}

export function resetPostCache(): void {
  postCache.clear();
}