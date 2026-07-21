// src/lib/sources/mangasee.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

const BASE_URL = "https://mangasee123.com";

export class MangaSeeSource implements SourceAdapter {
  id = "mangasee";
  name = "MangaSee";
  icon = "/icons/mangasee.svg";
  enabled = true;

  async search(query: string, page: number): Promise<SearchResult[]> {
    const res = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async popular(page: number): Promise<SearchResult[]> {
    const res = await fetch(`${BASE_URL}/directory/?page=${page}`);
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async latest(page: number): Promise<SearchResult[]> {
    const res = await fetch(`${BASE_URL}/directory/?page=${page}&sort=latest`);
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    const res = await fetch(
      `${BASE_URL}/directory/${genre}?page=${page}`
    );
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    const html = await res.text();
    return this.parseMangaDetails(html, mangaId);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    const html = await res.text();
    return this.parseChapters(html);
  }

  async getPages(chapterId: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/chapter/${chapterId}`);
    const html = await res.text();
    return this.parsePages(html);
  }

  private parseSearchResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const regex =
      /<a[^>]*class="[^"]*SeriesList[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      results.push({
        id: match[1].split("/").pop() || "",
        title: match[3].trim(),
        cover: match[2],
      });
    }

    return results;
  }

  private parseMangaDetails(html: string, mangaId: string): MangaDetails {
    const titleMatch = html.match(
      /<h1[^>]*class="[^"]*SeriesName[^"]*"[^>]*>([^<]*)<\/h1>/
    );
    const descMatch = html.match(
      /<div[^>]*class="[^"]*Summary[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );
    const statusMatch = html.match(
      /<div[^>]*class="[^"]*Status[^"]*"[^>]*>[^<]*<span[^>]*>([^<]*)<\/span>/
    );
    const coverMatch = html.match(
      /<img[^>]*class="[^"]*SeriesProfileImage[^"]*"[^>]*src="([^"]*)"/
    );

    const chapters = this.parseChapters(html);

    return {
      id: mangaId,
      title: titleMatch?.[1]?.trim() || "Unknown",
      cover: coverMatch?.[1] || "/placeholder.png",
      description: descMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusMatch?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const regex =
      /<a[^>]*class="[^"]*ChapterLink[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const numMatch = match[2].match(/Chapter\s*([\d.]+)/i);
      chapters.push({
        id: match[1].split("/").pop() || "",
        number: numMatch ? parseFloat(numMatch[1]) : 0,
        title: match[2].trim(),
      });
    }

    return chapters.reverse();
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const regex =
      /<img[^>]*class="[^"]*PageImage[^"]*"[^>]*src="([^"]*)"/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      pages.push(match[1]);
    }

    return pages;
  }
}
