import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import * as cheerio from 'cheerio';
import { createLogger } from '@/shared/utils/logger';

const logger = createLogger('ManhwaRead');

const BASE_URL = 'https://manhwaread.com';

function getBrowserHeaders(): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Connection': 'keep-alive',
  };
}

function isCloudflareChallenge(html: string): boolean {
  return html.includes('Just a moment') ||
    html.includes('Verify you are human') ||
    html.includes('_cf_chl_opt') ||
    html.includes('challenge-platform') ||
    html.includes('cf-turnstile');
}

async function fetchHtml(url: string): Promise<string> {
  logger.info(`Fetching ${url}`);

  const maxRetries = 2;
  let lastError: Error | undefined;
  let lastStatus: number | undefined;
  let lastBodySnippet = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let r: Response;
      try {
        r = await fetch(url, {
          headers: getBrowserHeaders(),
          signal: controller.signal,
          redirect: 'follow',
        });
      } finally {
        clearTimeout(timeout);
      }

      lastStatus = r.status;
      const text = await r.text();
      lastBodySnippet = text.slice(0, 1000);

      if (!r.ok) {
        const msg = `HTTP ${r.status} ${r.statusText}`;
        logger.warn(`Fetch attempt ${attempt}/${maxRetries} failed for ${url}`, {
          status: r.status,
          statusText: r.statusText,
          snippet: lastBodySnippet.slice(0, 200),
        });

        // Only retry on 5xx — 4xx is unlikely to resolve
        if (r.status >= 500) {
          lastError = new Error(msg);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
        throw new Error(msg);
      }

      if (isCloudflareChallenge(text)) {
        logger.warn(`Cloudflare challenge detected on ${url}`, { snippet: lastBodySnippet.slice(0, 200) });
        throw new Error('Cloudflare challenge — site is blocking server requests');
      }

      logger.info(`Fetch succeeded for ${url}`, { status: r.status, length: text.length });
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Fetch attempt ${attempt}/${maxRetries} error for ${url}`, {
        error: lastError.message,
        status: lastStatus,
      });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  logger.error(`All ${maxRetries} fetch attempts failed for ${url}`, {
    error: lastError?.message,
    status: lastStatus,
    snippet: lastBodySnippet.slice(0, 500),
  });
  throw lastError ?? new Error(`All fetch attempts failed for ${url}`);
}

function extractSlug(href: string): string {
  const match = href.match(/\/manhwa\/([^/]+)/);
  return match ? match[1] : href.replace(/\/+$/, '');
}

function extractChapterNumber(text: string): number {
  const match = text.match(/(?:Chapter|Ch\.?)\s*(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : 0;
}

function parseMangaList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('.manga-item.loop-item').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a.manga-item__link').first();
    const href = $link.attr('href') || '';
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $link.attr('title') || $link.text().trim() || '';
    const cover = $el.find('img.manga-item__img-inner').attr('src') ||
      $el.find('img.manga-item__img-inner').attr('data-src') || '';

    const genres: string[] = [];
    $el.find('.manga-item__genres span, .manga-item__tags span').each((_, g) => {
      const gText = $(g).text().trim();
      if (gText) genres.push(gText);
    });

    if (slug && title) {
      items.push({
        id: slug,
        providerId: 'manhwaread',
        title,
        alternativeTitles: [],
        description: '',
        cover,
        status: MangaStatus.UNKNOWN,
        genres,
        authors: [],
        artists: [],
        lastUpdate: null,
      });
    }
  });

  return items;
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

export class ManhwaReadProvider implements Provider {
  readonly id = 'manhwaread';
  readonly name = 'ManhwaRead';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = BASE_URL;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1, _filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const url = page === 1
      ? `${BASE_URL}/?s=${encodeURIComponent(query)}`
      : `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`;
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
    const html = await fetchHtml(`${BASE_URL}/manhwa/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $('.manga-titles').first().text().trim() || 'Unknown';
    const description = $('.manga-desc__content').text().trim() || '';

    const cover = $('meta[property="og:image"]').attr('content') || '';

    const statusText = $('.manga-status__label').text().toLowerCase().trim();
    let status = MangaStatus.UNKNOWN;
    if (statusText.includes('ongoing')) status = MangaStatus.ONGOING;
    else if (statusText.includes('completed')) status = MangaStatus.COMPLETED;
    else if (statusText.includes('hiatus')) status = MangaStatus.HIATUS;

    const genres: string[] = [];
    $('a[href*="/genre/"]').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const authors: string[] = [];
    $('a[href*="/author/"]').each((_, el) => {
      const a = $(el).text().trim();
      if (a) authors.push(a);
    });

    const artists: string[] = [];
    $('a[href*="/artist/"]').each((_, el) => {
      const a = $(el).text().trim();
      if (a) artists.push(a);
    });

    return {
      id: mangaId,
      providerId: 'manhwaread',
      title,
      alternativeTitles: [],
      description,
      cover,
      status,
      genres,
      authors,
      artists,
      lastUpdate: null,
    };
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const html = await fetchHtml(`${BASE_URL}/manhwa/${mangaId}/`);
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];

    $('a.chapter-item').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const name = $el.find('.chapter-item__name').text().trim();
      const dateText = $el.find('.chapter-item__date').text().trim();

      if (href && name) {
        const chapterPath = href.replace(`${BASE_URL}/`, '');
        const number = extractChapterNumber(name);

        let uploadDate: Date | null = null;
        if (dateText) {
          const parts = dateText.split('/');
          if (parts.length === 3) {
            uploadDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }

        chapters.push({
          id: chapterPath,
          mangaId,
          number,
          title: name,
          scanlationGroup: null,
          uploadDate: uploadDate && !isNaN(uploadDate.getTime()) ? uploadDate : null,
        });
      }
    });

    return chapters.reverse();
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const url = chapterId.startsWith('http')
      ? chapterId
      : `${BASE_URL}/${chapterId}`;
    const html = await fetchHtml(url);

    const chapterDataMatch = html.match(/chapterData\s*=\s*(\{[\s\S]*?\});/);
    if (!chapterDataMatch) {
      throw new Error('Could not find chapter data');
    }

    let chapterData: { data: string; base: string };
    try {
      chapterData = JSON.parse(chapterDataMatch[1]);
    } catch {
      throw new Error('Failed to parse chapter data');
    }

    const decoded = Buffer.from(chapterData.data, 'base64').toString('utf-8');
    let pages: { src: string; w: number; h: number }[];
    try {
      pages = JSON.parse(decoded);
    } catch {
      throw new Error('Failed to decode chapter pages');
    }

    return pages.map((page, index) => ({
      index,
      url: `${chapterData.base}/${page.src}`,
      headers: { Referer: BASE_URL },
    }));
  }

  async getPopular(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    let url: string;
    if (filters?.tags?.length) {
      const slug = filters.tags[0];
      url = page === 1
        ? `${BASE_URL}/genre/${slug}/`
        : `${BASE_URL}/genre/${slug}/page/${page}/`;
    } else {
      url = page === 1
        ? `${BASE_URL}/top-manhwa/`
        : `${BASE_URL}/top-manhwa/page/${page}/`;
    }

    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const totalPages = parseTotalPages(html);

    logger.info(`getPopular parsed ${items.length} items, ${totalPages} pages from ${url}`);
    return { data: items, page, totalPages, hasMore: page < totalPages };
  }

  async getLatest(page = 1, filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    let url: string;
    if (filters?.tags?.length) {
      const slug = filters.tags[0];
      url = page === 1
        ? `${BASE_URL}/genre/${slug}/`
        : `${BASE_URL}/genre/${slug}/page/${page}/`;
    } else {
      url = page === 1
        ? `${BASE_URL}/manhwa/`
        : `${BASE_URL}/manhwa/page/${page}/`;
    }

    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const totalPages = parseTotalPages(html);

    logger.info(`getLatest parsed ${items.length} items, ${totalPages} pages from ${url}`);
    return { data: items, page, totalPages, hasMore: page < totalPages };
  }
}
