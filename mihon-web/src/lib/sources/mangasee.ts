import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

export class MangaSeeSource implements SourceAdapter {
  id = "mangasee";
  name = "MangaSee";
  icon = "/icons/mangasee.svg";
  enabled = true;

  async search(query: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async popular(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async latest(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    throw new Error("Not implemented");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Not implemented");
  }

  async getPages(chapterId: string): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
