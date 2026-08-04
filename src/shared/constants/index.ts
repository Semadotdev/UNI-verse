export const BUILTIN_PROVIDER_IDS = [
  'mangadex',
  'mangasee',
  'mangakakalot',
  'manganato',
  'asurascans',
  'comick',
  'mangafire',
  'manhwa18',
  'webtoons',
] as const;

export type BuiltinProviderId = (typeof BUILTIN_PROVIDER_IDS)[number];

export const PROVIDER_TIMEOUT_MS = 30_000;

export const IMAGE_PROXY_CACHE_MAX_AGE = 86400;

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 50;

export const SEARCH_DEBOUNCE_MS = 300;
