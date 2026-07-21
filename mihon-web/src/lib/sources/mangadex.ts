import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

const BASE_URL = "https://api.mangadex.org";

interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: string;
    tags: Array<{ attributes: { name: Record<string, string> } }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { fileName?: string };
  }>;
}

interface MangaDexChapter {
  id: string;
  attributes: {
    chapter: string;
    title: string;
    publishAt: string;
  };
}

export class MangaDexSource implements SourceAdapter {
  id = "mangadex";
  name = "MangaDex";
  icon = "/icons/mangadex.svg";
  description = "MangaDex - Multi-language manga aggregator";
  enabled = true;

  private getEnglishTitle(manga: MangaDexManga): string {
    return manga.attributes.title.en || 
           Object.values(manga.attributes.title)[0] || 
           "Unknown";
  }

  private getCoverArt(manga: MangaDexManga): string {
    const cover = manga.relationships.find((r) => r.type === "cover_art");
    if (cover?.attributes?.fileName) {
      return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`;
    }
    return "/placeholder.png";
  }

  private getStatus(status: string): SearchResult["status"] {
    const statusMap: Record<string, SearchResult["status"]> = {
      ongoing: "ongoing",
      completed: "completed",
      hiatus: "hiatus",
      cancelled: "cancelled",
    };
    return statusMap[status] || "ongoing";
  }

  private getGenres(manga: MangaDexManga): string[] {
    return manga.attributes.tags.map(
      (tag) => tag.attributes.name.en || Object.values(tag.attributes.name)[0]
    );
  }

  async search(query: string, page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      title: query,
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[relevance]": "desc",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async popular(page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[followedCount]": "desc",
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async latest(page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[latestUploadedChapter]": "desc",
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "includedTags[]": genre,
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const params = new URLSearchParams({
      "includes[]": "cover_art",
    });

    const res = await fetch(`${BASE_URL}/manga/${mangaId}?${params}`);
    const data = await res.json();
    const manga = data.data as MangaDexManga;

    const chapters = await this.getChapters(mangaId);

    return {
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      description: manga.attributes.description.en || "",
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
      chapters,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        manga: mangaId,
        limit: "100",
        offset: offset.toString(),
        "translatedLanguage[]": "en",
        "order[chapter]": "asc",
      });

      const res = await fetch(`${BASE_URL}/chapter?${params}`);
      const data = await res.json();

      const batch = data.data.map((ch: MangaDexChapter) => ({
        id: ch.id,
        number: parseFloat(ch.attributes.chapter) || 0,
        title: ch.attributes.title,
        date: ch.attributes.publishAt,
      }));

      chapters.push(...batch);
      offset += 100;
      hasMore = batch.length === 100;
    }

    return chapters;
  }

  async getPages(chapterId: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
    const data = await res.json();

    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const dataFiles = data.chapter.data;

    return dataFiles.map(
      (file: string) => `${baseUrl}/data/${hash}/${file}`
    );
  }
}
