import type { Provider } from '@/domain/interfaces/provider';
import type { InstalledProvider } from '@/domain/types/extension';
import { ProviderError } from '@/shared/errors/provider-error';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ProviderRegistry');

interface RegistryEntry {
  provider: Provider;
  metadata: InstalledProvider;
}

class ProviderRegistry {
  private providers = new Map<string, RegistryEntry>();

  register(provider: Provider, metadata: InstalledProvider): void {
    this.providers.set(metadata.packageName, { provider, metadata });
    logger.info(`Registered provider: ${metadata.packageName}`);
  }

  unregister(packageName: string): void {
    this.providers.delete(packageName);
    logger.info(`Unregistered provider: ${packageName}`);
  }

  get(packageName: string): Provider {
    const entry = this.providers.get(packageName);
    if (!entry) throw ProviderError.notFound(packageName);
    return entry.provider;
  }

  getMetadata(packageName: string): InstalledProvider | undefined {
    return this.providers.get(packageName)?.metadata;
  }

  getAll(): InstalledProvider[] {
    return Array.from(this.providers.values()).map((e) => e.metadata);
  }

  getEnabled(): InstalledProvider[] {
    return this.getAll().filter((m) => m.enabled);
  }

  isEnabled(packageName: string): boolean {
    const meta = this.getMetadata(packageName);
    return meta?.enabled === true;
  }

  enable(packageName: string): void {
    const entry = this.providers.get(packageName);
    if (!entry) throw ProviderError.notFound(packageName);
    entry.metadata.enabled = true;
  }

  disable(packageName: string): void {
    const entry = this.providers.get(packageName);
    if (!entry) throw ProviderError.notFound(packageName);
    entry.metadata.enabled = false;
  }
}

const globalForRegistry = globalThis as unknown as {
  providerRegistry: ProviderRegistry | undefined;
};

export const providerRegistry =
  globalForRegistry.providerRegistry ?? new ProviderRegistry();

if (process.env.NODE_ENV !== 'production') {
  globalForRegistry.providerRegistry = providerRegistry;
}
