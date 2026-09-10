import type { Provider } from '@/domain/interfaces/provider';
import { AsuraScansProvider } from './asurascans';
import { FanFoxProvider } from './fanfox';
import { MangaDexProvider } from './mangadex';
import { Manhwa18Provider } from './manhwa18';
import { WebtoonsProvider } from './webtoons';

export function createBuiltinProviders(): Provider[] {
  return [
    new AsuraScansProvider(),
    new FanFoxProvider(),
    new MangaDexProvider(),
    new Manhwa18Provider(),
    new WebtoonsProvider(),
  ];
}
