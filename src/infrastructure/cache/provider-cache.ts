import { prisma } from '@/infrastructure/database/prisma-client';
import { createLogger } from '@/shared/utils/logger';
import type { Prisma } from '@prisma/client';

const logger = createLogger('ProviderCache');

const DATE_MARKER = '$date';

const CACHE_TTL = {
  details: 6 * 60 * 60 * 1000,
  chapters: 6 * 60 * 60 * 1000,
  pages: 60 * 60 * 1000,
  latest: 30 * 60 * 1000,
  popular: 30 * 60 * 1000,
  search: 30 * 60 * 1000,
} as const;

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = 0;

const inflight = new Map<string, Promise<unknown>>();

function serialize(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      v instanceof Date ? { [DATE_MARKER]: v.toISOString() } : v
    )
  ) as Prisma.InputJsonValue;
}

function deserialize<T>(value: Prisma.JsonValue): T {
  return JSON.parse(JSON.stringify(value), (_key, v) => {
    if (
      v &&
      typeof v === 'object' &&
      DATE_MARKER in v &&
      typeof (v as Record<string, unknown>)[DATE_MARKER] === 'string'
    ) {
      return new Date((v as Record<string, string>)[DATE_MARKER]);
    }
    return v;
  }) as T;
}

async function maybeSweep(): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = nowMs;
  try {
    const { count } = await prisma.providerCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0) logger.debug(`Swept ${count} expired provider cache rows`);
  } catch (error) {
    logger.warn('Provider cache sweep failed', error);
  }
}

export async function getOrFetch<T>(
  providerId: string,
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = new Date();

  const existing = await prisma.providerCache.findUnique({
    where: { providerId_cacheKey: { providerId, cacheKey } },
  });

  if (existing && new Date(existing.expiresAt) > now) {
    return deserialize<T>(existing.payload);
  }

  const inflightKey = `${providerId}:${cacheKey}`;
  const pending = inflight.get(inflightKey);
  if (pending) {
    return (await pending) as T;
  }

  const fetchPromise = (async () => {
    const value = await fetcher();
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      if (existing) {
        await prisma.providerCache.update({
          where: { id: existing.id },
          data: { payload: serialize(value), fetchedAt: now, expiresAt },
        });
      } else {
        await prisma.providerCache.create({
          data: { providerId, cacheKey, payload: serialize(value), fetchedAt: now, expiresAt },
        });
        void maybeSweep();
      }
    } catch (error) {
      logger.warn(`Failed to persist provider cache ${inflightKey}`, error);
    }

    return value;
  })();

  inflight.set(inflightKey, fetchPromise);
  try {
    return (await fetchPromise) as T;
  } finally {
    inflight.delete(inflightKey);
  }
}

export { CACHE_TTL };