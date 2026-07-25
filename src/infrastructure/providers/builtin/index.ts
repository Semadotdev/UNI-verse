import type { Provider } from '@/domain/interfaces/provider';
import { AsuraScansProvider } from './asurascans';
import { MangaDexProvider } from './mangadex';
import { ManhwaReadProvider } from './manhwaread';

export function createBuiltinProviders(): Provider[] {
  return [
    new AsuraScansProvider(),
    new MangaDexProvider(),
    new ManhwaReadProvider(),
  ];
}
