import type { Provider } from '@/domain/interfaces/provider';
import { MangaGoProvider } from './mangago';
import { AsuraScansProvider } from './asurascans';
import { NHentaiProvider } from './nhentai';
import { MangaDexProvider } from './mangadex';

export function createBuiltinProviders(): Provider[] {
  return [
    new MangaGoProvider(),
    new AsuraScansProvider(),
    new NHentaiProvider(),
    new MangaDexProvider(),
  ];
}
