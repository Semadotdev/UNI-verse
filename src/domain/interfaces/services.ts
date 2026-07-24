import type { Manga } from '../entities/manga';
import type { Chapter } from '../entities/chapter';
import type { Page } from '../entities/page';
import type { PaginatedResult } from '../types/api';
import type { InstalledProvider } from '../types/extension';
import type { Provider } from './provider';

export interface ProviderServiceInterface {
  getAll(): InstalledProvider[];
  getEnabled(): InstalledProvider[];
  enable(packageName: string): Promise<void>;
  disable(packageName: string): Promise<void>;
  getProvider(id: string): Provider;
}

export interface SearchServiceInterface {
  search(query: string, providerIds?: string[], page?: number): Promise<PaginatedResult<Manga>>;
  getPopular(providerId: string, page?: number): Promise<PaginatedResult<Manga>>;
  getLatest(providerId: string, page?: number): Promise<PaginatedResult<Manga>>;
}

export interface MangaServiceInterface {
  getDetails(providerId: string, mangaId: string): Promise<Manga>;
  getChapters(providerId: string, mangaId: string): Promise<Chapter[]>;
  getPages(providerId: string, chapterId: string): Promise<Page[]>;
}

export interface LibraryServiceInterface {
  getLibrary(userId: string, folderId?: string): Promise<unknown[]>;
  addToLibrary(userId: string, providerId: string, mangaId: string, data: Record<string, unknown>): Promise<unknown>;
  removeFromLibrary(userId: string, id: string): Promise<void>;
  updateBookmark(userId: string, libraryId: string, chapterId: string, data: Record<string, unknown>): Promise<unknown>;
  getFolders(userId: string): Promise<unknown[]>;
  createFolder(userId: string, name: string): Promise<unknown>;
  renameFolder(userId: string, folderId: string, name: string): Promise<unknown>;
  deleteFolder(userId: string, folderId: string): Promise<void>;
  moveToFolder(userId: string, libraryId: string, folderId: string | null): Promise<unknown>;
}

export interface HistoryServiceInterface {
  getHistory(userId: string): Promise<unknown[]>;
  updateProgress(userId: string, providerId: string, mangaId: string, data: Record<string, unknown>): Promise<void>;
  clearHistory(userId: string, id: string): Promise<void>;
}
