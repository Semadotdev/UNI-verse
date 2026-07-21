import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function abs(base: string, href: string): string {
  if (href.startsWith("http")) return href;
  return base.replace(/\/$/, "") + (href.startsWith("/") ? "" : "/") + href;
}

function extractChapterNum(text: string): number {
  const m = text.match(/(?:chapter|ch\.?)\s*([\d.]+)/i);
  return m ? parseFloat(m[1]) : 0;
}

// ─── MangaKakalot ────────────────────────────────────────────────────────────

export class MangaKakalotScraper implements SourceAdapter {
  id = "mangakakalot";
  name = "MangaKakalot";
  icon = "📚";
  description = "MangaKakalot - English manga reading site";
  enabled = true;
  private baseUrl = "https://mangakakalot.com";

  async search(query: string, _page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/search/story/${encodeURIComponent(query)}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseSearch(html);
    } catch {
      return [];
    }
  }

  async popular(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/manga_list?type=topview&category=all&state=all&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async latest(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/manga_list?type=latest&category=all&state=all&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/manga_list?type=topview&category=${encodeURIComponent(genre)}&state=all&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseMangaDetail(html, mangaId);
    } catch {
      return {
        id: mangaId,
        title: "Unknown",
        cover: "",
        chapters: [],
      };
    }
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseChapters(html);
    } catch {
      return [];
    }
  }

  async getPages(chapterId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/chapter/${chapterId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parsePages(html);
    } catch {
      return [];
    }
  }

  private parseSearch(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const itemRe =
      /<div[^>]*class="[^"]*search-story-item[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
    let m;
    while ((m = itemRe.exec(html)) !== null) {
      const href = m[1];
      const id = href.split("/").pop()?.replace(/\/$/, "") || "";
      results.push({
        id,
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseList(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const itemRe =
      /<div[^>]*class="[^"]*list-truyen-item-wrap[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
    let m;
    while ((m = itemRe.exec(html)) !== null) {
      const href = m[1];
      const id = href.split("/").pop()?.replace(/\/$/, "") || "";
      results.push({
        id,
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseMangaDetail(html: string, mangaId: string): MangaDetails {
    const titleM = html.match(
      /<div[^>]*class="[^"]*story-info-right[^"]*"[\s\S]*?<h1[^>]*>([^<]*)<\/h1>/
    );
    const coverM = html.match(
      /<div[^>]*class="[^"]*info-image[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/
    );
    const descM = html.match(
      /<div[^>]*class="[^"]*panel-story-info-description[^"]*"[\s\S]*?Description[^<]*<\/h3>([\s\S]*?)<\/div>/
    );
    const statusM = html.match(
      /Status[^<]*<\/th>[\s\S]*?<td[^>]*>([^<]*)<\/td>/
    );
    const chapters = this.parseChapters(html);
    return {
      id: mangaId,
      title: titleM?.[1]?.trim() || "Unknown",
      cover: coverM?.[1] || "",
      description: descM?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusM?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const re =
      /<a[^>]*class="[^"]*chapter-name[^"]*"[\s\S]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const id = href
        .split("/")
        .slice(-2)
        .join("/");
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      chapters.push({
        id,
        number: extractChapterNum(text),
        title: text,
      });
    }
    return chapters;
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const re =
      /<div[^>]*class="[^"]*container-chapter-reader[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      pages.push(m[1]);
    }
    return pages;
  }
}

// ─── MangaNato ───────────────────────────────────────────────────────────────

export class MangaNatoScraper implements SourceAdapter {
  id = "manganato";
  name = "MangaNato";
  icon = "📖";
  description = "MangaNato - English manga reading site";
  enabled = true;
  private baseUrl = "https://manganato.com";

  async search(query: string, _page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/search/story/${encodeURIComponent(query)}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseSearch(html);
    } catch {
      return [];
    }
  }

  async popular(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/genre-all?type=topview&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async latest(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/genre-all?type=latest&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/genre-${encodeURIComponent(genre)}?type=topview&page=${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    try {
      const res = await fetch(`${this.baseUrl}/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseMangaDetail(html, mangaId);
    } catch {
      return {
        id: mangaId,
        title: "Unknown",
        cover: "",
        chapters: [],
      };
    }
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    try {
      const res = await fetch(`${this.baseUrl}/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseChapters(html);
    } catch {
      return [];
    }
  }

  async getPages(chapterId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/${chapterId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parsePages(html);
    } catch {
      return [];
    }
  }

  private parseSearch(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const re =
      /<div[^>]*class="[^"]*search-story-item[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const id = href.split("/").pop()?.replace(/\/$/, "") || "";
      results.push({
        id,
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseList(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const re =
      /<div[^>]*class="[^"]*content-genres-item[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const id = href.split("/").pop()?.replace(/\/$/, "") || "";
      results.push({
        id,
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseMangaDetail(html: string, mangaId: string): MangaDetails {
    const titleM = html.match(
      /<div[^>]*class="[^"]*story-info-right[^"]*"[\s\S]*?<h1[^>]*>([^<]*)<\/h1>/
    );
    const coverM = html.match(
      /<div[^>]*class="[^"]*info-image[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/
    );
    const descM = html.match(
      /Description[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/
    );
    const statusM = html.match(
      /Status[^<]*<\/th>[\s\S]*?<td[^>]*>([^<]*)<\/td>/
    );
    const chapters = this.parseChapters(html);
    return {
      id: mangaId,
      title: titleM?.[1]?.trim() || "Unknown",
      cover: coverM?.[1] || "",
      description: descM?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusM?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const re =
      /<a[^>]*class="[^"]*chapter-name[^"]*"[\s\S]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const id = href
        .split("/")
        .slice(-2)
        .join("/");
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      chapters.push({
        id,
        number: extractChapterNum(text),
        title: text,
      });
    }
    return chapters;
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const re =
      /<div[^>]*class="[^"]*container-chapter-reader[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      pages.push(m[1]);
    }
    return pages;
  }
}

// ─── Asura Scans ─────────────────────────────────────────────────────────────

export class AsuraScansScraper implements SourceAdapter {
  id = "asurascans";
  name = "Asura Scans";
  icon = "🐉";
  description = "Asura Scans - Korean & English manhwa";
  enabled = true;
  private baseUrl = "https://asurascans.com";

  async search(query: string, _page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=wp-manga`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseSearch(html);
    } catch {
      return [];
    }
  }

  async popular(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/page/${page}/?m_orderby=views`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async latest(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/page/${page}/?m_orderby=latest`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/manga-genre/${encodeURIComponent(genre)}/page/${page}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}/`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseMangaDetail(html, mangaId);
    } catch {
      return {
        id: mangaId,
        title: "Unknown",
        cover: "",
        chapters: [],
      };
    }
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}/`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseChapters(html);
    } catch {
      return [];
    }
  }

  async getPages(chapterId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/${chapterId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parsePages(html);
    } catch {
      return [];
    }
  }

  private parseSearch(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const re =
      /<div[^>]*class="[^"]*c-tabs-item__content[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h4[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<span>([^<]*)<\/span>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const slugMatch = href.match(/\/manga\/([^/]+)/);
      results.push({
        id: slugMatch?.[1] || href.split("/").filter(Boolean).pop() || "",
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseList(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const re =
      /<div[^>]*class="[^"]*page-item-detail[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<span>([^<]*)<\/span>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const slugMatch = href.match(/\/manga\/([^/]+)/);
      results.push({
        id: slugMatch?.[1] || href.split("/").filter(Boolean).pop() || "",
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseMangaDetail(html: string, mangaId: string): MangaDetails {
    const titleM = html.match(
      /<div[^>]*class="[^"]*post-title[^"]*"[\s\S]*?<h1[^>]*>([^<]*)<\/h1>/
    );
    const coverM = html.match(
      /<div[^>]*class="[^"]*summary_image[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/
    );
    const descM = html.match(
      /<div[^>]*class="[^"]*summary__content[^"]*"[\s\S]*?>([\s\S]*?)<\/div>/
    );
    const statusM = html.match(
      /<div[^>]*class="[^"]*post-status[^"]*"[\s\S]*?Status[^<]*<\/div>[\s\S]*?<div[^>]*>([^<]*)<\/div>/
    );
    const chapters = this.parseChapters(html);
    return {
      id: mangaId,
      title: titleM?.[1]?.trim() || "Unknown",
      cover: coverM?.[1] || "",
      description: descM?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusM?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const re =
      /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const slugMatch = href.match(/\/manga\/[^/]+\/([^/]+)/);
      const id = slugMatch?.[1] || href.split("/").filter(Boolean).pop() || "";
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      chapters.push({
        id,
        number: extractChapterNum(text),
        title: text,
      });
    }
    return chapters;
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const re =
      /<div[^>]*class="[^"]*reading-content[^"]*"[\s\S]*?<img[^>]*data-src="([^"]*)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      pages.push(m[1]);
    }
    return pages;
  }
}

// ─── Comick ──────────────────────────────────────────────────────────────────

export class ComickScraper implements SourceAdapter {
  id = "comick";
  name = "Comick";
  icon = "🔥";
  description = "Comick - Manga aggregator with API";
  enabled = true;
  private apiBase = "https://api.comick.io/v1.0";

  async search(query: string, _page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.apiBase}/search?q=${encodeURIComponent(query)}&type=comic&limit=20`,
        { headers: HEADERS }
      );
      if (!res.ok) return [];
      const data: ComicItem[] = await res.json();
      return data.map((c) => ({
        id: c.slug || c.hid,
        title: c.title || "Unknown",
        cover: c.cover?.includes("http")
          ? c.cover
          : c.cover
            ? `https://uploads.comick.io${c.cover}`
            : "",
        description: c.desc || undefined,
        genres: c.comic?.tags?.map((t: Tag) => t.name),
      }));
    } catch {
      return [];
    }
  }

  async popular(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.apiBase}/comics?order=views&limit=20&page=${page}`,
        { headers: HEADERS }
      );
      if (!res.ok) return [];
      const data: ComicItem[] = await res.json();
      return data.map((c) => ({
        id: c.slug || c.hid,
        title: c.title || "Unknown",
        cover: c.cover?.includes("http")
          ? c.cover
          : c.cover
            ? `https://uploads.comick.io${c.cover}`
            : "",
        genres: c.comic?.tags?.map((t: Tag) => t.name),
      }));
    } catch {
      return [];
    }
  }

  async latest(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.apiBase}/comics?order=latest&limit=20&page=${page}`,
        { headers: HEADERS }
      );
      if (!res.ok) return [];
      const data: ComicItem[] = await res.json();
      return data.map((c) => ({
        id: c.slug || c.hid,
        title: c.title || "Unknown",
        cover: c.cover?.includes("http")
          ? c.cover
          : c.cover
            ? `https://uploads.comick.io${c.cover}`
            : "",
        genres: c.comic?.tags?.map((t: Tag) => t.name),
      }));
    } catch {
      return [];
    }
  }

  async byGenre(_genre: string, page: number): Promise<SearchResult[]> {
    return this.popular(page);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    try {
      const res = await fetch(`${this.apiBase}/comics/${mangaId}`, {
        headers: HEADERS,
      });
      if (!res.ok)
        return {
          id: mangaId,
          title: "Unknown",
          cover: "",
          chapters: [],
        };
      const c: ComicDetail = await res.json();
      const statusMap: Record<string, SearchResult["status"]> = {
        ongoing: "ongoing",
        completed: "completed",
        hiatus: "hiatus",
        cancelled: "cancelled",
      };
      return {
        id: mangaId,
        title: c.title || "Unknown",
        cover: c.cover?.includes("http")
          ? c.cover
          : c.cover
            ? `https://uploads.comick.io${c.cover}`
            : "",
        description: c.desc || "",
        status: statusMap[c.status || ""] || "ongoing",
        genres: c.comic?.tags?.map((t: Tag) => t.name),
        chapters: [],
      };
    } catch {
      return {
        id: mangaId,
        title: "Unknown",
        cover: "",
        chapters: [],
      };
    }
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    try {
      const res = await fetch(`${this.apiBase}/comics/${mangaId}/chapters`, {
        headers: HEADERS,
      });
      if (!res.ok) return [];
      const data: ChapterItem[] = await res.json();
      return data.map((ch) => {
        const groups = ch.groups || [];
        const groupSlug = groups[0]?.slug || "";
        const lang = ch.lang || "en";
        return {
          id: ch.hid || `${mangaId}/${ch.slug}`,
          number: ch.chap ? parseFloat(ch.chap) : 0,
          title: ch.title || `Chapter ${ch.chap || "?"}`,
          date: ch.created_at,
        };
      });
    } catch {
      return [];
    }
  }

  async getPages(chapterId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.apiBase}/chapter/${chapterId}/images`, {
        headers: HEADERS,
      });
      if (!res.ok) return [];
      const data: ImageResponse = await res.json();
      return (data.images || []).map(
        (img) =>
          img.url?.includes("http")
            ? img.url
            : `https://uploads.comick.io${img.url}`
      );
    } catch {
      return [];
    }
  }
}

interface Tag {
  name: string;
  slug?: string;
}

interface ComicItem {
  hid: string;
  slug?: string;
  title?: string;
  cover?: string;
  desc?: string;
  status?: number;
  comic?: { tags?: Tag[] };
}

interface ComicDetail {
  title?: string;
  cover?: string;
  desc?: string;
  status?: string;
  comic?: { tags?: Tag[] };
}

interface ChapterItem {
  hid?: string;
  slug?: string;
  chap?: string;
  title?: string;
  lang?: string;
  created_at?: string;
  groups?: { slug?: string }[];
}

interface ImageResponse {
  images?: { url?: string }[];
}

// ─── MangaFire ───────────────────────────────────────────────────────────────

export class MangaFireScraper implements SourceAdapter {
  id = "mangafire";
  name = "MangaFire";
  icon = "🔥";
  description = "MangaFire - English manga reading site";
  enabled = true;
  private baseUrl = "https://mangafire.to";

  async search(query: string, _page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `${this.baseUrl}/filter?keyword=${encodeURIComponent(query)}`,
        { headers: HEADERS }
      );
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async popular(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(`${this.baseUrl}/most-popular?page=${page}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async latest(page: number): Promise<SearchResult[]> {
    try {
      const res = await fetch(`${this.baseUrl}/latest-update?page=${page}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseList(html);
    } catch {
      return [];
    }
  }

  async byGenre(_genre: string, page: number): Promise<SearchResult[]> {
    return this.popular(page);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseMangaDetail(html, mangaId);
    } catch {
      return {
        id: mangaId,
        title: "Unknown",
        cover: "",
        chapters: [],
      };
    }
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    try {
      const res = await fetch(`${this.baseUrl}/manga/${mangaId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parseChapters(html);
    } catch {
      return [];
    }
  }

  async getPages(chapterId: string): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/${chapterId}`, {
        headers: HEADERS,
      });
      const html = await res.text();
      return this.parsePages(html);
    } catch {
      return [];
    }
  }

  private parseList(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const re =
      /<div[^>]*class="[^"]*item[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<h3[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/h3>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const slugMatch = href.match(/\/manga\/([^/?]+)/);
      results.push({
        id: slugMatch?.[1] || href.split("/").filter(Boolean).pop() || "",
        title: m[3].trim(),
        cover: m[2],
      });
    }
    return results;
  }

  private parseMangaDetail(html: string, mangaId: string): MangaDetails {
    const titleM = html.match(
      /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/h1>/
    );
    const coverM = html.match(
      /<img[^>]*class="[^"]*poster[^"]*"[^>]*src="([^"]*)"/
    );
    const descM = html.match(
      /<div[^>]*class="[^"]*info[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/
    );
    const statusM = html.match(
      /Status[^<]*<\/dt>[\s\S]*?<dd[^>]*>([^<]*)<\/dd>/
    );
    const chapters = this.parseChapters(html);
    return {
      id: mangaId,
      title: titleM?.[1]?.trim() || "Unknown",
      cover: coverM?.[1] || "",
      description: descM?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusM?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const re =
      /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*chapter[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      const slugMatch = href.match(/\/manga\/[^/]+\/([^/?]+)/);
      const id = slugMatch?.[1] || href.split("/").filter(Boolean).pop() || "";
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      chapters.push({
        id,
        number: extractChapterNum(text),
        title: text,
      });
    }
    return chapters;
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const re =
      /<div[^>]*class="[^"]*reader[^"]*"[\s\S]*?<img[^>]*src="([^"]*)"/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      pages.push(m[1]);
    }
    return pages;
  }
}
