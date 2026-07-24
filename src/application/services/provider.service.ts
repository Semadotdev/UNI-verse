import { prisma } from '@/infrastructure/database/prisma-client';
import { providerRegistry } from '@/infrastructure/providers/registry';
import { initializeBuiltinProviders } from '@/infrastructure/providers/initialize';
import type { InstalledProvider } from '@/domain/types/extension';
import { ProviderError } from '@/shared/errors/provider-error';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ProviderService');

export class ProviderService {
  async initialize(): Promise<void> {
    await initializeBuiltinProviders();
  }

  async getAll(): Promise<InstalledProvider[]> {
    await this.ensureInitialized();
    return providerRegistry.getAll();
  }

  async getEnabled(): Promise<InstalledProvider[]> {
    await this.ensureInitialized();
    return providerRegistry.getEnabled();
  }

  async enable(packageName: string): Promise<void> {
    const dbProvider = await prisma.provider.findUnique({ where: { packageName } });
    if (!dbProvider) throw ProviderError.notFound(packageName);

    await prisma.provider.update({
      where: { packageName },
      data: { enabled: true },
    });

    providerRegistry.enable(packageName);
    logger.info(`Enabled provider: ${packageName}`);
  }

  async disable(packageName: string): Promise<void> {
    const dbProvider = await prisma.provider.findUnique({ where: { packageName } });
    if (!dbProvider) throw ProviderError.notFound(packageName);

    await prisma.provider.update({
      where: { packageName },
      data: { enabled: false },
    });

    providerRegistry.disable(packageName);
    logger.info(`Disabled provider: ${packageName}`);
  }

  getProvider(packageName: string) {
    return providerRegistry.get(packageName);
  }

  private async ensureInitialized(): Promise<void> {
    if (providerRegistry.getAll().length === 0) {
      await initializeBuiltinProviders();
    }
  }
}
