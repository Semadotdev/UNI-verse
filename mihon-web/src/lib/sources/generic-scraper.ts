import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

export interface ScraperConfig {
  searchUrl: (query: string, page: number) => string;
  popularUrl: (page: number) => string;
  latestUrl: (page: number) => string;
  mangaUrl: (mangaId: string) => string;
  chapterUrl: (chapterId: string) => string;
  searchResults: RegExp;
  popularResults: RegExp;
  latestResults: RegExp;
  mangaTitle: RegExp;
  mangaCover: RegExp;
  mangaDescription: RegExp;
  mangaStatus: RegExp;
  chapterList: RegExp;
  pageImages: RegExp;
}

const DEFAULT_CONFIG: ScraperConfig = {
  searchUrl: (query: string, page: number) => `/search?q=${encodeURIComponent(query)}&page=${page}`,
  popularUrl: (page: number) => `/directory/?page=${page}`,
  latestUrl: (page: number) => `/directory/?page=${page}&sort=latest`,
  mangaUrl: (mangaId: string) => `/manga/${mangaId}`,
  chapterUrl: (chapterId: string) => `/chapter/${chapterId}`,

  searchResults:
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]*)<\/h[1-6]>/g,

  popularResults:
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]*)<\/h[1-6]>/g,

  latestResults:
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]*)<\/h[1-6]>/g,

  mangaTitle: /<h[1-6][^>]*>([^<]*)<\/h[1-6]>/,
  mangaCover: /<img[^>]*src="([^"]*)"[^>]*>/,
  mangaDescription: /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  mangaStatus: /<div[^>]*class="[^"]*status[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/i,
  chapterList:
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g,
  pageImages: /<img[^>]*src="([^"]*)"[^>]*>/g,
};

function toAbsolute(baseUrl: string, url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

export class GenericScraperSource implements SourceAdapter {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean = true;
  private baseUrl: string;
  private config: ScraperConfig;

  constructor(
    id: string,
    name: string,
    baseUrl: string,
    description: string,
    config?: Partial<ScraperConfig>
  ) {
    this.id = id;
    this.name = name;
    this.icon = `/icons/${id}.svg`;
    this.baseUrl = baseUrl;
    this.description = description;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async fetchPage(path: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: this.baseUrl,
      },
    });
    return res.text();
  }

  private parseResults(
    html: string,
    regex: RegExp
  ): SearchResult[] {
    const seen = new Set<string>();
    const results: SearchResult[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const rawId = match[1].split("/").pop() || "";
      const title = match[3]?.trim();
      const cover = toAbsolute(this.baseUrl, match[2]);

      if (!rawId || !title || seen.has(rawId)) continue;
      seen.add(rawId);

      results.push({
        id: rawId,
        title,
        cover,
      });
    }

    return results;
  }

  async search(query: string, page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.searchUrl(query, page));
    return this.parseResults(html, this.config.searchResults);
  }

  async popular(page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.popularUrl(page));
    return this.parseResults(html, this.config.popularResults);
  }

  async latest(page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.latestUrl(page));
    return this.parseResults(html, this.config.latestResults);
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(
      `/directory/${genre}?page=${page}`
    );
    return this.parseResults(html, this.config.searchResults);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const html = await this.fetchPage(this.config.mangaUrl(mangaId));

    const titleMatch = html.match(this.config.mangaTitle);
    const coverMatch = html.match(this.config.mangaCover);
    const descMatch = html.match(this.config.mangaDescription);
    const statusMatch = html.match(this.config.mangaStatus);
    const chapters = this.parseChapters(html);

    return {
      id: mangaId,
      title: titleMatch?.[1]?.trim() || "Unknown",
      cover: coverMatch
        ? toAbsolute(this.baseUrl, coverMatch[1])
        : "/placeholder.png",
      description: descMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusMatch?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.fetchPage(this.config.mangaUrl(mangaId));
    return this.parseChapters(html);
  }

  async getPages(chapterId: string): Promise<string[]> {
    const html = await this.fetchPage(this.config.chapterUrl(chapterId));
    const pages: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = this.config.pageImages.exec(html)) !== null) {
      pages.push(toAbsolute(this.baseUrl, match[1]));
    }

    return pages;
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    let match: RegExpExecArray | null;

    while ((match = this.config.chapterList.exec(html)) !== null) {
      const id = match[1].split("/").pop() || "";
      const label = match[2]?.trim();
      if (!id || !label) continue;

      const numMatch = label.match(/Chapter\s*([\d.]+)/i);
      chapters.push({
        id,
        number: numMatch ? parseFloat(numMatch[1]) : 0,
        title: label,
      });
    }

    return chapters.reverse();
  }
}
