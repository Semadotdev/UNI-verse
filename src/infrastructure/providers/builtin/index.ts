import type { Provider } from '@/domain/interfaces/provider';
import { AsuraScansProvider } from './asurascans';
import { MangaDexProvider } from './mangadex';
import { Manhwa18Provider } from './manhwa18';
import { WebtoonsProvider } from './webtoons';

export function createBuiltinProviders(): Provider[] {
  return [
    new AsuraScansProvider(),
    new MangaDexProvider(),
    new Manhwa18Provider(),
    new WebtoonsProvider(),
  ];
}
