import type { Provider } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { parseMangaStatus } from '@/domain/entities/manga';
import { withRetry } from '@/shared/utils/retry';

const API_BASE = 'https://api.asurascans.com/api';
const SITE_BASE = 'https://asurascans.com';
const PAGE_SIZE = 20;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.5',
};

const HTML_HEADERS = {
  ...HEADERS,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

interface AsuraChapter {
  id: number;
  number: number;
  slug: string;
  title: string;
  published_at: string;
}

interface AsuraChaptersResponse {
  data: AsuraChapter[];
}

interface AsuraSeries {
  id: number;
  slug: string;
  title: string;
  alt_titles?: string[];
  alternative_titles?: string[];
  description: string;
  cover: string;
  status: string;
  type: string;
  author?: string;
  artist?: string;
  genres: Array<{ id: number; name: string; slug: string }>;
  chapter_count: number;
  bookmark_count: number;
  public_url: string;
  latest_chapters: Array<{
    id: number;
    number: number;
    slug: string;
    published_at: string;
  }>;
}

interface AsuraApiResponse {
  data: AsuraSeries[];
  meta?: { total: number; per_page: number; has_more: boolean };
}

function mapSeriesToManga(s: AsuraSeries): Manga {
  const altTitles = s.alt_titles || s.alternative_titles || [];
  return {
    id: s.slug,
    providerId: 'asurascans',
    title: s.title,
    alternativeTitles: altTitles,
    description: s.description?.replace(/<[^>]+>/g, '') || '',
    cover: s.cover,
    status: parseMangaStatus(s.status),
    genres: s.genres?.map(g => g.name) || [],
    authors: s.author ? [s.author] : [],
    artists: s.artist ? [s.artist] : [],
    lastUpdate: null,
    latestChapter: s.chapter_count || undefined,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await withRetry(async () => {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });
  return res.json() as Promise<T>;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await withRetry(async () => {
    const r = await fetch(url, { headers: HTML_HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });
  return res.text();
}

export class AsuraScansProvider implements Provider {
  readonly id = 'asurascans';
  readonly name = 'Asura Scans';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = SITE_BASE;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1): Promise<PaginatedResult<Manga>> {
    const offset = (page - 1) * PAGE_SIZE;
    const url = `${API_BASE}/series?search=${encodeURIComponent(query)}&offset=${offset}`;
    const data = await fetchJson<AsuraApiResponse>(url);
    const items = (data.data || []).map(mapSeriesToManga);
    const total = data.meta?.total || items.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      data: items,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const url = `${API_BASE}/series/${mangaId}`;
    const data = await fetchJson<{ data?: { series: AsuraSeries }; series?: AsuraSeries }>(url);
    const series = data.data?.series ?? data.series;
    if (!series) throw new Error(`Manga not found: ${mangaId}`);
    return mapSeriesToManga(series);
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const url = `${API_BASE}/series/${mangaId}/chapters`;
    const data = await fetchJson<AsuraChaptersResponse>(url);

    return (data.data || []).map(ch => ({
      id: `${mangaId}/${ch.number}`,
      mangaId,
      number: ch.number,
      title: ch.title || `Chapter ${ch.number}`,
      scanlationGroup: null,
      uploadDate: ch.published_at ? new Date(ch.published_at) : null,
    }));
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const [mangaSlug, chapterNum] = chapterId.split('/');
    const url = `${SITE_BASE}/comics/${mangaSlug}/chapter/${chapterNum}`;
    const html = await fetchHtml(url);

    const cdnPattern = `https://cdn.asurascans.com/asura-images/chapters/${mangaSlug}/${chapterNum}/[^"\\s&]+`;
    const regex = new RegExp(cdnPattern, 'g');
    const urls: string[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[0]);
    }

    return urls.map((url, i) => ({
      index: i,
      url,
      headers: { Referer: SITE_BASE },
    }));
  }

  async getPopular(page = 1): Promise<PaginatedResult<Manga>> {
    const offset = (page - 1) * PAGE_SIZE;
    const url = `${API_BASE}/series?sort=POPULAR&offset=${offset}`;
    const data = await fetchJson<AsuraApiResponse>(url);
    const items = (data.data || []).map(mapSeriesToManga);
    const total = data.meta?.total || items.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }

  async getLatest(page = 1): Promise<PaginatedResult<Manga>> {
    const offset = (page - 1) * PAGE_SIZE;
    const url = `${API_BASE}/series?sort=LATEST&offset=${offset}`;
    const data = await fetchJson<AsuraApiResponse>(url);
    const items = (data.data || []).map(mapSeriesToManga);
    const total = data.meta?.total || items.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }
}
