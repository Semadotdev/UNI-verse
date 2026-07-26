import type { Manga } from '../entities/manga';
import type { Chapter } from '../entities/chapter';
import type { Page } from '../entities/page';
import type { PaginatedResult } from '../types/api';

export interface ProviderFilters {
  tags?: string[];
  sort?: string;
  status?: string;
  minChapters?: number;
}

export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly lang: string;
  readonly baseUrl: string;
  readonly icon?: string;

  readonly hasSearch: boolean;
  readonly hasPopular: boolean;
  readonly hasLatest: boolean;

  search(query: string, page?: number, filters?: ProviderFilters): Promise<PaginatedResult<Manga>>;
  getMangaDetails(mangaId: string): Promise<Manga>;
  getChapterList(mangaId: string): Promise<Chapter[]>;
  getPageList(chapterId: string): Promise<Page[]>;

  getPopular?(page?: number, filters?: ProviderFilters): Promise<PaginatedResult<Manga>>;
  getLatest?(page?: number, filters?: ProviderFilters): Promise<PaginatedResult<Manga>>;
}

export type ProviderConstructor = new () => Provider;
