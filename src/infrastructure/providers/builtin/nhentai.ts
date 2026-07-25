import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import { withRetry } from '@/shared/utils/retry';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://nhentai.net';

function extractGalleryId(href: string): string | null {
  const match = href.match(/\/g\/(\d+)\//);
  return match ? match[1] : null;
}

function extractInternalId(dataSrc: string): string | null {
  const match = dataSrc.match(/galleries\/(\d+)\//);
  return match ? match[1] : null;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchHtml(url: string): Promise<string> {
  const res = await withRetry(async () => {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      const contentType = r.headers.get('content-type') || '';
      if (r.status === 403 && contentType.includes('text/html')) {
        return r;
      }
      throw new Error(`HTTP ${r.status}`);
    }
    return r;
  });
  return res.text();
}

function buildSearchQuery(filters?: ProviderFilters): string {
  const parts = ['language:english'];
  if (filters?.tags?.length) {
    for (const tag of filters.tags) {
      parts.push(`tag:${tag}`);
    }
  }
  return parts.join(' ');
}

function buildSortParam(filters?: ProviderFilters): string {
  if (filters?.sort && filters.sort !== 'date') {
    return `&sort=${filters.sort}`;
  }
  return '';
}

function parseGalleryList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];

  $('a.cover').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const id = extractGalleryId(href);
    if (!id) return;

    const $img = $el.find('img.lazyload, img');
    const title = $img.attr('alt') || $el.find('.caption').text().trim() || `NHentai #${id}`;
    const cover = $img.attr('data-src') || $img.attr('src') || '';

    items.push({
      id,
      providerId: 'nhentai',
      title,
      alternativeTitles: [],
      description: '',
      cover,
      status: MangaStatus.UNKNOWN,
      genres: [],
      authors: [],
      artists: [],
      lastUpdate: null,
    });
  });

  return items;
}

function parseNhentaiTotalPages(html: string): number {
  const match = html.match(/page=(\d+)[^>]*class="last[^"]*"/);
  return match ? parseInt(match[1], 10) : 1;
}

export class NHentaiProvider implements Provider {
  readonly id = 'nhentai';
  readonly name = 'NHentai';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = BASE_URL;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const baseQuery = buildSearchQuery(filters);
    const searchQuery = query ? `${query} ${baseQuery}` : baseQuery;
    const sortParam = buildSortParam(filters);
    const url = `${BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&page=${page}${sortParam}`;
    const html = await fetchHtml(url);
    const items = parseGalleryList(html);
    const totalPages = parseNhentaiTotalPages(html);

    return {
      data: items,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const html = await fetchHtml(`${BASE_URL}/g/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $('#info h1').first().text().trim() || `NHentai #${mangaId}`;
    const jpTitle = $('#info h2').first().text().trim();
    const coverImg = $('#info .cover img, .thumb-container img').first().attr('data-src') ||
      $('#info .cover img, .thumb-container img').first().attr('src') || '';

    // Parse tag groups by label
    const artists: string[] = [];
    let category = '';
    const genres: string[] = [];

    $('#tags .tag-container').each((_, container) => {
      const label = $(container).text().split(':')[0].trim().toLowerCase();
      $(container).find('span.name').each((_, el) => {
        const name = $(el).text().trim();
        if (!name) return;
        if (label === 'artists') {
          artists.push(name);
        } else if (label === 'categories') {
          category = name;
        } else if (label === 'tags') {
          genres.push(name);
        } else if (label === 'parodies' || label === 'characters') {
          genres.push(name);
        }
      });
    });

    // Upload date
    const uploadedText = $('div:first:contains("Uploaded")').text() || '';
    const dateMatch = uploadedText.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
    const lastUpdate = dateMatch ? new Date(dateMatch[1]) : null;

    // Page thumbnails
    const pageThumbnails: string[] = [];
    $('a.gallerythumb img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      if (src) pageThumbnails.push(src);
    });

    return {
      id: mangaId,
      providerId: 'nhentai',
      title,
      alternativeTitles: jpTitle ? [jpTitle] : [],
      description: genres.join(', '),
      cover: coverImg,
      status: MangaStatus.UNKNOWN,
      genres,
      authors: artists,
      artists,
      lastUpdate: lastUpdate && !isNaN(lastUpdate.getTime()) ? lastUpdate : null,
      pageCount: pageThumbnails.length || undefined,
      category: category || undefined,
      pageThumbnails: pageThumbnails.length ? pageThumbnails : undefined,
    };
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    return [{
      id: `${mangaId}`,
      mangaId,
      number: 1,
      title: null,
      scanlationGroup: null,
      uploadDate: null,
    }];
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const html = await fetchHtml(`${BASE_URL}/g/${chapterId}/`);
    const $ = cheerio.load(html);

    const thumbs: { num: number; internalId: string }[] = [];
    $('a.gallerythumb img').each((_, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      const match = src.match(/galleries\/(\d+)\/(\d+)t?\.\w+/);
      if (match) {
        thumbs.push({ num: parseInt(match[2]), internalId: match[1] });
      }
    });

    if (thumbs.length === 0) {
      const coverSrc = $('img.lazyload').first().attr('data-src') || $('img.lazyload').first().attr('src') || '';
      const internalId = extractInternalId(coverSrc);
      if (internalId) {
        return [{
          index: 0,
          url: `https://i1.nhentai.net/galleries/${internalId}/1.jpg`,
          headers: { Referer: `${BASE_URL}/` },
          direct: true,
        }];
      }
    }

    return thumbs.map(t => ({
      index: t.num - 1,
      url: `https://i1.nhentai.net/galleries/${t.internalId}/${t.num}.jpg`,
      headers: { Referer: `${BASE_URL}/` },
      direct: true,
    }));
  }

  async getPopular(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const query = buildSearchQuery(filters);
    const sortParam = buildSortParam({ ...filters, sort: filters?.sort || 'popular' });
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}${sortParam}`;
    const html = await fetchHtml(url);
    const items = parseGalleryList(html);
    const totalPages = parseNhentaiTotalPages(html);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }

  async getLatest(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const query = buildSearchQuery(filters);
    const sortParam = buildSortParam(filters);
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}${sortParam}`;
    const html = await fetchHtml(url);
    const items = parseGalleryList(html);
    const totalPages = parseNhentaiTotalPages(html);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }
}
