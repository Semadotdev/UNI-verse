import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import { providerRegistry } from '@/infrastructure/providers/registry';
import { initializeBuiltinProviders } from '@/infrastructure/providers/initialize';
import { ProviderError } from '@/shared/errors/provider-error';

export class MangaService {
  async getDetails(providerId: string, mangaId: string): Promise<Manga> {
    const provider = await this.findProvider(providerId);
    return provider.getMangaDetails(mangaId);
  }

  async getChapters(providerId: string, mangaId: string): Promise<Chapter[]> {
    const provider = await this.findProvider(providerId);
    return provider.getChapterList(mangaId);
  }

  async getPages(providerId: string, chapterId: string): Promise<Page[]> {
    const provider = await this.findProvider(providerId);
    return provider.getPageList(chapterId);
  }

  private async findProvider(providerId: string) {
    if (providerRegistry.getAll().length === 0) {
      await initializeBuiltinProviders();
    }
    const meta = providerRegistry.getEnabled().find((p) => p.providerId === providerId);
    if (!meta) throw ProviderError.notFound(providerId);
    return providerRegistry.get(meta.packageName);
  }
}
