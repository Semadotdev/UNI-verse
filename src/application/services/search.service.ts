import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { PaginatedResult } from '@/domain/types/api';
import { providerRegistry } from '@/infrastructure/providers/registry';
import { initializeBuiltinProviders } from '@/infrastructure/providers/initialize';
import { ProviderError } from '@/shared/errors/provider-error';
import { createLogger } from '@/shared/utils/logger';
import { CACHE_TTL, getOrFetch } from '@/infrastructure/cache/provider-cache';

const logger = createLogger('SearchService');

function stableKey(value: unknown): string {
  if (value === undefined) return '';
  return JSON.stringify(value, Object.keys(value ?? {}).sort());
}

export class SearchService {
  async search(
    query: string,
    providerIds?: string[],
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const providers = providerIds
      ? await Promise.all(providerIds.map((id) => this.findProvider(id)))
      : providerRegistry.getEnabled().map((m) => providerRegistry.get(m.packageName));

    const results = await Promise.allSettled(
      providers.map(async (p) => {
        try {
          return await getOrFetch(p.id, `srch:${query}:${page}:${stableKey(filters)}`, CACHE_TTL.search, () =>
            p.search(query, page, filters)
          );
        } catch (error) {
          logger.error(`Search failed for provider ${p.id}`, error);
          return { data: [], page: 1, totalPages: 0, hasMore: false };
        }
      })
    );

    const allManga = results
      .filter((r): r is PromiseFulfilledResult<PaginatedResult<Manga>> => r.status === 'fulfilled')
      .flatMap((r) => r.value.data);

    const maxTotalPages = results
      .filter((r): r is PromiseFulfilledResult<PaginatedResult<Manga>> => r.status === 'fulfilled')
      .reduce((max, r) => Math.max(max, r.value.totalPages), 0);

    const hasMore = results
      .filter((r): r is PromiseFulfilledResult<PaginatedResult<Manga>> => r.status === 'fulfilled')
      .some((r) => r.value.hasMore);

    return {
      data: allManga,
      page,
      totalPages: maxTotalPages,
      hasMore,
    };
  }

  async getPopular(providerId: string, page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const provider = await this.findProvider(providerId);
    if (!provider.getPopular) {
      throw ProviderError.invalidModule(providerId, 'does not support popular');
    }
    return getOrFetch<PaginatedResult<Manga>>(providerId, `pop:${page}:${stableKey(filters)}`, CACHE_TTL.popular, () =>
      provider.getPopular!(page, filters)
    );
  }

  async getLatest(providerId: string, page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const provider = await this.findProvider(providerId);
    if (!provider.getLatest) {
      throw ProviderError.invalidModule(providerId, 'does not support latest');
    }
    return getOrFetch<PaginatedResult<Manga>>(providerId, `lt:${page}:${stableKey(filters)}`, CACHE_TTL.latest, () =>
      provider.getLatest!(page, filters)
    );
  }

  private async findProvider(providerId: string): Promise<Provider> {
    try {
      if (providerRegistry.getAll().length === 0) {
        logger.info('No providers registered, initializing builtin providers');
        await initializeBuiltinProviders();
      }
    } catch (error) {
      logger.error('Failed to initialize providers', error);
      throw new ProviderError('Provider initialization failed', providerId, 'PROVIDER_INIT_FAILED');
    }
    const meta = providerRegistry.getEnabled().find((p) => p.providerId === providerId);
    if (!meta) throw ProviderError.notFound(providerId);
    return providerRegistry.get(meta.packageName);
  }
}
