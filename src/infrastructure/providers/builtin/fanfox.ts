import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import * as cheerio from 'cheerio';
import { createLogger } from '@/shared/utils/logger';
import { withRetry } from '@/shared/utils/retry';
import { decodeImageUrls } from './fanfox/packer';

const logger = createLogger('FanFox');
const BASE_URL = 'https://newm.fanfox.net';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  // Unlocks the chapter list for age-gated titles server-side.
  Cookie: 'isAdult=1',
};

// chapterfun.ashx mimics the site's reader XHR: it requires a same-site
// Referer and an XHR flag to return the packed image list.
const AJAX_HEADERS: Record<string, string> = {
  ...HEADERS,
  Referer: `${BASE_URL}/`,
  'X-Requested-With': 'XMLHttpRequest',
};

const IMAGE_REFERER = `${BASE_URL}/`;
const LIST_PAGE_SIZE = 12;
const BATCH_DELAY_MS = 500;

const GENRE_SLUGS = [
  'action', 'adventure', 'comedy', 'drama', 'fantasy', 'martial-arts',
  'shounen', 'horror', 'supernatural', 'harem', 'psychological', 'romance',
  'school-life', 'shoujo', 'mystery', 'sci-fi', 'seinen', 'tragedy', 'ecchi',
  'sports', 'slice-of-life', 'mature', 'shoujo-ai', 'webtoons', 'doujinshi',
  'one-shot', 'smut', 'yaoi', 'josei', 'historical', 'shounen-ai',
  'gender-bender', 'adult', 'yuri', 'mecha', 'lolicon', 'shotacon',
] as const;

export function toGenreSlug(tag: string): string | null {
  const slug = tag.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return GENRE_SLUGS.includes(slug as (typeof GENRE_SLUGS)[number]) ? slug : null;
}

function toDirectorySort(sort?: string): string | null {
  if (!sort) return null;
  switch (sort.toLowerCase()) {
    case 'popularity':
    case 'views':
    case 'trending':
      return '?po';
    case 'new':
    case 'newest':
      return '?news';
    case 'rating':
    case 'ratings':
    case 'toprated':
      return '?rating';
    default:
      return null;
  }
}

function normalizeStatus(status?: string): string | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'complete') return 'completed';
  if (s === 'ongoing') return 'ongoing';
  return null;
}

export function buildDirectoryUrl(
  filters?: ProviderFilters
): string | null {
  const genre = filters?.tags?.map(toGenreSlug).find(Boolean);
  if (!genre) return null;

  let url = `${BASE_URL}/directory/${genre}/`;
  const status = normalizeStatus(filters?.status);
  if (status) url += `${status}/`;
  const sort = toDirectorySort(filters?.sort);
  if (sort) url += sort;

  return url;
}

function absolute(url: string): string {
  if (!url) return '';
  return url.startsWith('//') ? `https:${url}` : url;
}

export function buildSearchUrl(query: string, page = 1): string {
  const normalized = query.trim().toLowerCase();
  return `${BASE_URL}/search?title=${encodeURIComponent(normalized)}&page=${page}`;
}

// FanFox's own search relevance is non-deterministic between requests. To give
// stable, case-insensitive results, the exact title match is pinned first and
// the remaining items are ordered alphabetically.
export function orderSearchResults<T extends { title: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim().toLowerCase();
  return [...items].sort((a, b) => {
    const aExact = a.title.trim().toLowerCase() === q ? 0 : 1;
    const bExact = b.title.trim().toLowerCase() === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}

async function fetchHtml(
  url: string,
  headers: Record<string, string> = HEADERS
): Promise<string> {
  logger.info(`Fetching ${url}`);
  const html = await withRetry(async () => {
    const r = await fetch(url, { headers, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
    return r.text();
  });
  logger.info(`Fetch succeeded for ${url}`, { length: html.length });
  return html;
}

// Shared card lists (search, releases, ranking) render manga anchors with
// slug paths and cover thumbnails on the mobile theme (.manga-list-2).
export function parseMangaList(html: string, providerId: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('.manga-list-2 li').each((_, el) => {
    const $li = $(el);
    const $a = $li.find('a[href*="/manga/"]').first();
    const href = $a.attr('href') || '';
    const match = href.match(/\/manga\/([^/]+)\/?$/);
    if (!match) return;

    const title =
      $a.attr('title') || $li.find('.manga-list-2-title a').first().text().trim() || '';
    if (!title) return;

    if (seen.has(match[1])) return;
    seen.add(match[1]);

    items.push({
      id: match[1],
      providerId,
      title,
      alternativeTitles: [],
      description: '',
      cover: absolute($li.find('img.manga-list-2-cover-img').first().attr('src') || ''),
      status: MangaStatus.UNKNOWN,
      genres: [],
      authors: [],
      artists: [],
      lastUpdate: null,
    });
  });

  return items;
}

function parseLastUpdate(text: string): Date | null {
  const match = text.match(/([A-Za-z]+)\s+(\d{1,2})\s*,\s*(\d{4})/);
  if (!match) return null;
  const monthIndex = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ].findIndex((m) => m === match[1].toLowerCase().slice(0, 3));
  if (monthIndex === -1) return null;
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const date = new Date(year, monthIndex, day);
  return isNaN(date.getTime()) ? null : date;
}

export function parseMangaDetails(
  html: string,
  mangaId: string,
  providerId: string
): Manga {
  const $ = cheerio.load(html);

  const title =
    $('.detail-top-bar-info-title').first().text().trim() ||
    $('meta[name="og:title"]').attr('content') ||
    mangaId;
  const description = $('.detail-text-bar').first().text().trim();
  const cover = absolute($('.detail-top-bar-cover img').first().attr('src') || '');
  const genres = $('.detail-tag-bar a')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const authors = $('.detail-author-bar a')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const lastUpdate = parseLastUpdate(
    $('.detail-top-bar-info-update').first().text()
  );

  return {
    id: mangaId,
    providerId,
    title,
    alternativeTitles: [],
    description,
    cover,
    status: MangaStatus.UNKNOWN,
    genres,
    authors,
    artists: [],
    lastUpdate,
  };
}

export function parseChapterList(html: string, mangaId: string): Chapter[] {
  const $ = cheerio.load(html);
  const chapters: Chapter[] = [];
  const prefix = `/manga/${mangaId}/`;

  $('#chapterlist .detail-chapters-list a').each((_, el) => {
    const $a = $(el);
    const href = $a.attr('href') || '';
    if (!href.startsWith(prefix)) return;

    const path = href.slice(prefix.length).replace(/\/1\.html$/, '');
    if (!path) return;

    const label = $a.text().trim() || $a.attr('title') || '';

    let number = 0;
    const numMatch = label.match(/Ch\.\s*([\d.]+)/i) || path.match(/c([\d.]+)/i);
    if (numMatch) number = parseFloat(numMatch[1]);

    chapters.push({
      id: `${mangaId}/${path}`,
      mangaId,
      number,
      title: label || null,
      scanlationGroup: null,
      uploadDate: null,
    });
  });

  return chapters;
}

export class FanFoxProvider implements Provider {
  readonly id = 'fanfox';
  readonly name = 'FanFox';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = BASE_URL;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(
    query: string,
    page = 1,
    _filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const url = buildSearchUrl(query, page);
    const html = await fetchHtml(url);
    const items = parseMangaList(html, this.id);
    const hasMore = items.length >= LIST_PAGE_SIZE;
    const data = orderSearchResults(items, query);
    return { data, page, totalPages: hasMore ? 0 : 1, hasMore };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const html = await fetchHtml(`${BASE_URL}/manga/${mangaId}/`);
    return parseMangaDetails(html, mangaId, this.id);
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const html = await fetchHtml(`${BASE_URL}/manga/${mangaId}/`);
    return parseChapterList(html, mangaId);
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const parts = chapterId.split('/');
    if (parts.length !== 2 && parts.length !== 3) {
      throw new Error(`Invalid fanfox chapter id: ${chapterId}`);
    }

    const mangaId = parts[0];
    const path = parts.length === 3 ? `${parts[1]}/${parts[2]}` : parts[1];

    const readerUrl = `${BASE_URL}/manga/${mangaId}/${path}/1.html`;
    const html = await fetchHtml(readerUrl);

    const chapterIdMatch = html.match(/var\s+chapterid\s*=\s*"?(\d+)/i);
    const imageCountMatch = html.match(/var\s+imagecount\s*=\s*"?(\d+)/i);
    if (!chapterIdMatch || !imageCountMatch) {
      throw new Error(`Could not resolve reader variables for ${readerUrl}`);
    }

    const cid = chapterIdMatch[1];
    const total = parseInt(imageCountMatch[1], 10);
    const pages: Page[] = [];

    for (let p = 1; p <= total && pages.length < total; p += 2) {
      const ashxUrl = `${BASE_URL}/manga/${mangaId}/${path}/chapterfun.ashx?cid=${cid}&page=${p}&key=`;
      const ajaxHeaders = { ...AJAX_HEADERS, Referer: readerUrl };
      const body = await fetchHtml(ashxUrl, ajaxHeaders);
      const urls = decodeImageUrls(body);

      const needed = total - pages.length;
      for (const url of urls.slice(0, needed)) {
        if (!url) continue;
        pages.push({ index: pages.length, url, headers: { Referer: IMAGE_REFERER } });
      }

      if (p + 1 < total && pages.length < total) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    if (pages.length < total) {
      logger.warn(`Collected ${pages.length}/${total} pages for ${chapterId}`);
    }

    return pages;
  }

  async getPopular(
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const dirUrl = buildDirectoryUrl(filters);

    let url: string;
    if (dirUrl) {
      url = filters?.sort ? dirUrl : `${dirUrl}?po`;
    } else {
      url = `${BASE_URL}/ranking/`;
    }

    const html = await fetchHtml(url);
    const items = parseMangaList(html, this.id);
    return { data: items, page, totalPages: 1, hasMore: false };
  }

  async getLatest(
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const dirUrl = buildDirectoryUrl(filters);

    if (dirUrl) {
      const html = await fetchHtml(dirUrl);
      const items = parseMangaList(html, this.id);
      return { data: items, page, totalPages: 1, hasMore: false };
    }

    const html = await fetchHtml(`${BASE_URL}/releases/${page}.html`);
    const items = parseMangaList(html, this.id);
    const hasMore = items.length >= LIST_PAGE_SIZE;
    return { data: items, page, totalPages: hasMore ? 0 : 1, hasMore };
  }
}