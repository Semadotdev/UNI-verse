import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
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

function applyFilters(items: Manga[], filters?: ProviderFilters): Manga[] {
  if (!filters) return items;
  return items.filter(m => {
    if (filters.status && m.status !== filters.status) return false;
    if (filters.minChapters && (!m.latestChapter || m.latestChapter < filters.minChapters)) return false;
    return true;
  });
}

const MAX_FILTER_PAGES = 4;

async function fetchWithFilters(
  buildUrl: (offset: number) => string,
  filters?: ProviderFilters,
): Promise<{ items: Manga[]; totalBeforeFilter: number }> {
  if (!filters?.status && !filters?.minChapters) {
    const data = await fetchJson<AsuraApiResponse>(buildUrl(0));
    return { items: (data.data || []).map(mapSeriesToManga), totalBeforeFilter: data.meta?.total || 0 };
  }

  const pagePromises = Array.from({ length: MAX_FILTER_PAGES }, (_, i) =>
    fetchJson<AsuraApiResponse>(buildUrl(i * PAGE_SIZE))
  );
  const pages = await Promise.all(pagePromises);
  const allSeries = pages.flatMap(p => p.data || []);
  const totalBeforeFilter = pages[0]?.meta?.total || allSeries.length;
  const filtered = applyFilters(allSeries.map(mapSeriesToManga), filters);
  const seen = new Set<string>();
  const unique = filtered.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  return { items: unique, totalBeforeFilter };
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

  async search(query: string, page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const hasActiveFilters = !!(filters?.status || filters?.minChapters);
    const fetchOffset = hasActiveFilters ? 0 : (page - 1) * PAGE_SIZE;
    const { items: allFiltered, totalBeforeFilter } = await fetchWithFilters(
      (offset) => `${API_BASE}/series?search=${encodeURIComponent(query)}&offset=${offset}`,
      filters,
    );

    if (hasActiveFilters) {
      const start = (page - 1) * PAGE_SIZE;
      const pageItems = allFiltered.slice(start, start + PAGE_SIZE);
      const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
      return { data: pageItems, page, totalPages, hasMore: page < totalPages };
    }

    const totalPages = Math.max(1, Math.ceil(totalBeforeFilter / PAGE_SIZE));
    return { data: allFiltered, page, totalPages, hasMore: page < totalPages };
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

    const unique = [...new Set(urls)];
    return unique.map((url, i) => ({
      index: i,
      url,
      headers: { Referer: SITE_BASE },
    }));
  }

  async getPopular(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const hasActiveFilters = !!(filters?.status || filters?.minChapters);
    const { items: allFiltered, totalBeforeFilter } = await fetchWithFilters(
      (offset) => `${API_BASE}/series?sort=POPULAR&offset=${offset}`,
      filters,
    );

    if (hasActiveFilters) {
      const start = (page - 1) * PAGE_SIZE;
      const pageItems = allFiltered.slice(start, start + PAGE_SIZE);
      const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
      return { data: pageItems, page, totalPages, hasMore: page < totalPages };
    }

    const totalPages = Math.max(1, Math.ceil(totalBeforeFilter / PAGE_SIZE));
    return { data: allFiltered, page, totalPages, hasMore: page < totalPages };
  }

  async getLatest(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const hasActiveFilters = !!(filters?.status || filters?.minChapters);
    const { items: allFiltered, totalBeforeFilter } = await fetchWithFilters(
      (offset) => `${API_BASE}/series?sort=LATEST&offset=${offset}`,
      filters,
    );

    if (hasActiveFilters) {
      const start = (page - 1) * PAGE_SIZE;
      const pageItems = allFiltered.slice(start, start + PAGE_SIZE);
      const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
      return { data: pageItems, page, totalPages, hasMore: page < totalPages };
    }

    const totalPages = Math.max(1, Math.ceil(totalBeforeFilter / PAGE_SIZE));
    return { data: allFiltered, page, totalPages, hasMore: page < totalPages };
  }
}
