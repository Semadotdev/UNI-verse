import { prisma } from '@/infrastructure/database/prisma-client';
import { providerRegistry } from './registry';
import { createBuiltinProviders } from './builtin';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ProviderInit');

export async function initializeBuiltinProviders(): Promise<void> {
  if (providerRegistry.getAll().length > 0) {
    logger.info('Providers already initialized');
    return;
  }

  const providers = createBuiltinProviders();

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
        nsfw: provider.id === 'manhwaread',
        hasSearch: provider.hasSearch,
        hasPopular: provider.hasPopular,
        hasLatest: provider.hasLatest,
      },
      update: {
        name: provider.name,
        version: provider.version,
        nsfw: provider.id === 'manhwaread',
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

  logger.info(`Initialized ${providers.length} built-in providers`);
}
