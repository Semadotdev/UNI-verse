export interface SearchResult {
  id: string;
  title: string;
  cover: string;
  description?: string;
  status?: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres?: string[];
}

export interface MangaDetails extends SearchResult {
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title?: string;
  date?: string;
}

export interface SourceAdapter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;

  search(query: string, page: number): Promise<SearchResult[]>;
  popular(page: number): Promise<SearchResult[]>;
  latest(page: number): Promise<SearchResult[]>;
  byGenre(genre: string, page: number): Promise<SearchResult[]>;
  getManga(mangaId: string): Promise<MangaDetails>;
  getChapters(mangaId: string): Promise<Chapter[]>;
  getPages(chapterId: string): Promise<string[]>;
}
