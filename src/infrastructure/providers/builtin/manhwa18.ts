import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import * as cheerio from 'cheerio';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('Manhwa18');
const BASE_URL = 'https://manhwa18.cc';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchHtml(url: string): Promise<string> {
  logger.info(`Fetching ${url}`);
  const r = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  const html = await r.text();
  logger.info(`Fetch succeeded for ${url}`, { status: r.status, length: html.length });
  return html;
}

function extractSlug(href: string): string {
  const match = href.match(/\/webtoon\/([^/]+)/);
  return match ? match[1] : href.replace(/\/+$/, '');
}

function extractChapterNumber(text: string): number {
  const match = text.match(/(?:Chapter\.?|Ch\.?)\s*(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : 0;
}

function parseMangaList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('.manga-item').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a[title]').first();
    const href = $link.attr('href') || '';
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $link.attr('title') || '';
    const cover =
      $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';

    const chapterText = $el.find('.list-chapter .chapter-item .chapter a').first().text().trim();
    const latestChapter = chapterText ? extractChapterNumber(chapterText) || null : null;

    if (slug && title) {
      items.push({
        id: slug,
        providerId: 'manhwa18',
        title: title.trim(),
        alternativeTitles: [],
        description: '',
        cover,
        status: MangaStatus.UNKNOWN,
        genres: [],
        authors: [],
        artists: [],
        lastUpdate: null,
        latestChapter: latestChapter ?? undefined,
      });
    }
  });

  return items;
}

function applyFilters(items: Manga[], filters?: ProviderFilters): Manga[] {
  if (!filters) return items;
  let filtered = items;
  if (filters.minChapters && filters.minChapters > 0) {
    filtered = filtered.filter(
      (m) => m.latestChapter != null && m.latestChapter >= filters.minChapters!
    );
  }
  return filtered;
}

function parseTotalPages(html: string): number {
  const $ = cheerio.load(html);
  let maxPage = 1;
  $('a[href*="/page/"]').each((_, el) => {
    const match = $(el).attr('href')?.match(/\/page\/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxPage) maxPage = num;
    }
  });
  return maxPage;
}

export class Manhwa18Provider implements Provider {
  readonly id = 'manhwa18';
  readonly name = 'Manhwa18';
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
    const url =
      page === 1
        ? `${BASE_URL}/search?q=${encodeURIComponent(query)}`
        : `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const totalPages = parseTotalPages(html);

    return {
      data: items,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const html = await fetchHtml(`${BASE_URL}/webtoon/${mangaId}`);
    const $ = cheerio.load(html);

    const rawTitle =
      $('.post-title h1').text().trim() || 'Unknown';
    const title = rawTitle.replace(/^18\+\s*/, '').trim();

    const description =
      $('.summary_content .post-content').text().trim() || '';

    const cover =
      $('meta[property="og:image"]').attr('content') ||
      $('.summary_image img').attr('data-src') ||
      $('.summary_image img').attr('src') ||
      '';

    const genres: string[] = [];
    $('.genres-content a').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const authors: string[] = [];
    $('.author-content a').each((_, el) => {
      const a = $(el).text().trim();
      if (a) authors.push(a);
    });

    let status = MangaStatus.UNKNOWN;
    const statusText = $('.post-status').text().toLowerCase();
    if (statusText.includes('ongoing') || statusText.includes('publishing'))
      status = MangaStatus.ONGOING;
    else if (statusText.includes('complete') || statusText.includes('finished'))
      status = MangaStatus.COMPLETED;
    else if (statusText.includes('hiatus')) status = MangaStatus.HIATUS;
    else if (statusText.includes('cancel')) status = MangaStatus.CANCELLED;

    return {
      id: mangaId,
      providerId: 'manhwa18',
      title,
      alternativeTitles: [],
      description,
      cover,
      status,
      genres,
      authors,
      artists: [],
      lastUpdate: null,
    };
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const html = await fetchHtml(`${BASE_URL}/webtoon/${mangaId}`);
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];

    $('.row-content-chapter li.a-h').each((_, el) => {
      const $el = $(el);
      const $link = $el.find('a.chapter-name');
      const href = $link.attr('href') || '';
      const name = $link.text().trim();
      const dateText = $el.find('.chapter-time').text().trim();

      if (href && name) {
        const chapterPath = href.replace(`${BASE_URL}/`, '').replace(/^\/+/, '');
        const number = extractChapterNumber(name);

        let uploadDate: Date | null = null;
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) uploadDate = parsed;
        }

        chapters.push({
          id: chapterPath,
          mangaId,
          number,
          title: name,
          scanlationGroup: null,
          uploadDate,
        });
      }
    });

    return chapters.reverse();
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const url = chapterId.startsWith('http')
      ? chapterId
      : `${BASE_URL}/${chapterId}`;
    logger.info(`Fetching chapter pages from ${url}`);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const container = $('.read-content');
    const imgSource = container.length ? container : $('body');
    logger.info(`Image container found: ${container.length > 0}, img source: ${container.length ? '.read-content' : 'body'}`);

    const pages: Page[] = [];
    imgSource.find('img').each((_index, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      if (src && (src.includes('chapters') || /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(src))) {
        pages.push({
          index: pages.length,
          url: src,
          headers: { Referer: BASE_URL },
        });
      }
    });

    logger.info(`Parsed ${pages.length} chapter pages from ${url}`);
    return pages;
  }

  async getPopular(
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const hasChapterFilter = (filters?.minChapters ?? 0) > 0;

    if (hasChapterFilter && !filters?.tags?.length) {
      const MAX_PAGES = 4;
      const allItems: Manga[] = [];
      const seenAll = new Set<string>();
      let totalPages = 1;

      for (let p = 1; p <= MAX_PAGES; p++) {
        const url = p === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${p}`;
        try {
          const html = await fetchHtml(url);
          const $ = cheerio.load(html);

          $('.hot-item').each((_, el) => {
            const $el = $(el);
            const $link = $el.find('a').first();
            const href = $link.attr('href') || '';
            const slug = extractSlug(href);
            if (!slug || seenAll.has(slug)) return;
            seenAll.add(slug);

            const title = $link.attr('title') || $el.find('h4').text().trim() || '';
            const cover = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
            const chapterBadge = $el.find('.chapter-badges').text().trim();
            const latestChapter = chapterBadge ? extractChapterNumber(chapterBadge) || null : null;

            if (slug && title) {
              allItems.push({
                id: slug, providerId: 'manhwa18', title: title.trim(),
                alternativeTitles: [], description: '', cover,
                status: MangaStatus.UNKNOWN, genres: [], authors: [],
                artists: [], lastUpdate: null, latestChapter: latestChapter ?? undefined,
              });
            }
          });

          if (allItems.length === 0 && p > 1) break;
          if (p === 1) totalPages = parseTotalPages(html);
        } catch { break; }
      }

      const filtered = applyFilters(allItems, filters);
      const pageSize = 20;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        data: paged,
        page,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        hasMore: start + pageSize < filtered.length,
      };
    }

    let url: string;
    if (filters?.tags?.length) {
      const slug = filters.tags[0];
      url = `${BASE_URL}/webtoon-genre/${slug}`;
    } else {
      url = page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}`;
    }

    const html = await fetchHtml(url);

    let items: Manga[];
    if (filters?.tags?.length) {
      items = parseMangaList(html);
    } else {
      const $ = cheerio.load(html);
      items = [];
      const seen = new Set<string>();

      $('.hot-item').each((_, el) => {
        const $el = $(el);
        const $link = $el.find('a').first();
        const href = $link.attr('href') || '';
        const slug = extractSlug(href);
        if (!slug || seen.has(slug)) return;
        seen.add(slug);

        const title = $link.attr('title') || $el.find('h4').text().trim() || '';
        const cover =
          $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';

        const chapterBadge = $el.find('.chapter-badges').text().trim();
        const latestChapter = chapterBadge ? extractChapterNumber(chapterBadge) || null : null;

        if (slug && title) {
          items.push({
            id: slug,
            providerId: 'manhwa18',
            title: title.trim(),
            alternativeTitles: [],
            description: '',
            cover,
            status: MangaStatus.UNKNOWN,
            genres: [],
            authors: [],
            artists: [],
            lastUpdate: null,
            latestChapter: latestChapter ?? undefined,
          });
        }
      });
    }

    const totalPages = filters?.tags?.length ? 1 : parseTotalPages(html);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }

  async getLatest(
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const hasChapterFilter = (filters?.minChapters ?? 0) > 0;

    if (hasChapterFilter) {
      const MAX_PAGES = 4;
      const allItems: Manga[] = [];
      const seen = new Set<string>();
      let totalPages = 1;

      for (let p = 1; p <= MAX_PAGES; p++) {
        const url = p === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${p}`;
        try {
          const html = await fetchHtml(url);
          const pageItems = parseMangaList(html);
          if (pageItems.length === 0) break;
          for (const item of pageItems) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              allItems.push(item);
            }
          }
          if (p === 1) totalPages = parseTotalPages(html);
        } catch { break; }
      }

      const filtered = applyFilters(allItems, filters);
      const pageSize = 20;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      return {
        data: paged,
        page,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        hasMore: start + pageSize < filtered.length,
      };
    }

    let url: string;
    if (filters?.tags?.length) {
      const slug = filters.tags[0];
      url = `${BASE_URL}/webtoon-genre/${slug}`;
    } else {
      url = page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}`;
    }

    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const totalPages = filters?.tags?.length ? 1 : parseTotalPages(html);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }
}
