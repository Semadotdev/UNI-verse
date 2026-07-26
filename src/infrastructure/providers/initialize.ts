import { prisma } from '@/infrastructure/database/prisma-client';
import { providerRegistry } from './registry';
import { createBuiltinProviders } from './builtin';
import type { Provider } from '@/domain/interfaces/provider';
import type { InstalledProvider } from '@/domain/types/extension';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ProviderInit');

function createFallbackMetadata(provider: Provider): InstalledProvider {
  return {
    packageName: `builtin:${provider.id}`,
    providerId: provider.id,
    name: provider.name,
    version: provider.version,
    lang: provider.lang,
    description: null,
    icon: null,
    nsfw: provider.id === 'manhwa18',
    enabled: true,
    hasSearch: provider.hasSearch,
    hasPopular: provider.hasPopular,
    hasLatest: provider.hasLatest,
  };
}

export async function initializeBuiltinProviders(): Promise<void> {
  if (providerRegistry.getAll().length > 0) {
    logger.info('Providers already initialized');
    return;
  }

  const providers = createBuiltinProviders();

  for (const provider of providers) {
    providerRegistry.register(provider, createFallbackMetadata(provider));
  }

  try {
    for (const provider of providers) {
      const packageName = `builtin:${provider.id}`;

      await prisma.provider.upsert({
        where: { packageName },
        create: {
          packageName,
          name: provider.name,
          providerId: provider.id,
          version: provider.version,
          lang: provider.lang,
          enabled: true,
          nsfw: provider.id === 'manhwa18',
          hasSearch: provider.hasSearch,
          hasPopular: provider.hasPopular,
          hasLatest: provider.hasLatest,
        },
        update: {
          name: provider.name,
          version: provider.version,
          nsfw: provider.id === 'manhwa18',
        },
      });

      const metadata = await prisma.provider.findUnique({
        where: { packageName },
      });

      if (metadata) {
        providerRegistry.register(provider, {
          packageName: metadata.packageName,
          providerId: metadata.providerId,
          name: metadata.name,
          version: metadata.version,
          lang: metadata.lang,
          description: metadata.description,
          icon: metadata.icon,
          nsfw: metadata.nsfw,
          enabled: metadata.enabled,
          hasSearch: metadata.hasSearch,
          hasPopular: metadata.hasPopular,
          hasLatest: metadata.hasLatest,
        });
      }
    }
  } catch (error) {
    logger.warn('Database unavailable during provider init, using in-memory providers', error);
  }

  logger.info(`Initialized ${providers.length} built-in providers`);
}
