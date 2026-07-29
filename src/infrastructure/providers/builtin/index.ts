import type { Provider } from '@/domain/interfaces/provider';
import { AsuraScansProvider } from './asurascans';
import { MangaDexProvider } from './mangadex';
import { MangahubProvider } from './mangahub';
import { Manhwa18Provider } from './manhwa18';

export function createBuiltinProviders(): Provider[] {
  return [
    new AsuraScansProvider(),
    new MangaDexProvider(),
    new MangahubProvider(),
    new Manhwa18Provider(),
  ];
}
