import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import * as cheerio from 'cheerio';
import { createLogger } from '@/shared/utils/logger';
import { withRetry } from '@/shared/utils/retry';

const logger = createLogger('Webtoons');
const BASE_URL = 'https://www.webtoons.com';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const IMAGE_REFERER = `${BASE_URL}/`;

// The list page renders ~9-10 episodes per page and the placeholder path
// redirect drops the `page` param, so getChapterList resolves the canonical
// URL first and paginates from there. Out-of-range pages clamp to the last
// page, so dedupe is the stop condition. Pages are fetched in batches of 5
// for throughput; 100 pages covers ~1000 episodes (more than any webtoon).
const MAX_LIST_PAGES = 100;
const PAGE_BATCH_SIZE = 4;
const BATCH_DELAY_MS = 750;

// Webtoons resolves content purely from title_no / episode_no query params and
// 301-redirects any placeholder path to the canonical one, so the ids in app
// URLs stay short while requests are still routed to the right page.
function detailUrl(titleNo: string): string {
  return `${BASE_URL}/en/wt/${titleNo}/list?title_no=${titleNo}`;
}

function viewerUrl(titleNo: string, episodeNo: string): string {
  return `${BASE_URL}/en/wt/${titleNo}/${episodeNo}/viewer?title_no=${titleNo}&episode_no=${episodeNo}`;
}

async function fetchHtml(url: string): Promise<string> {
  logger.info(`Fetching ${url}`);
  const html = await withRetry(async () => {
    const r = await fetch(url, { headers: HEADERS, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
    return r.text();
  });
  logger.info(`Fetch succeeded for ${url}`, { length: html.length });
  return html;
}

function toGenreSlug(tag: string): string | null {
  const slug = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!slug) return null;
  const GENRE_SLUGS: Record<string, string> = {
    action: 'action',
    comedy: 'comedy',
    drama: 'drama',
    fantasy: 'fantasy',
    graphic: 'graphic_novel',
    heartwarming: 'heartwarming',
    historical: 'historical',
    horror: 'horror',
    mystery: 'mystery',
    romance: 'romance',
    sf: 'sf',
    slice: 'slice_of_life',
    sports: 'sports',
    super: 'super_hero',
    supernatural: 'supernatural',
    thriller: 'thriller',
  };
  return GENRE_SLUGS[slug] ?? null;
}

function toSortOrder(sort?: string): string | null {
  if (!sort) return null;
  switch (sort.toLowerCase()) {
    case 'date':
    case 'update':
    case 'updated':
      return 'UPDATE';
    case 'popularity':
    case 'views':
    case 'trending':
      return 'MANA';
    case 'likes':
      return 'LIKEIT';
    default:
      return null;
  }
}

function parseChapterList(html: string, mangaId: string): Chapter[] {
  const $ = cheerio.load(html);
  const chapters: Chapter[] = [];

  $('#_listUl li a.detail_list_link').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const episodeMatch = href.match(/episode_no=(\d+)/);
    if (!episodeMatch) return;

    const episodeNo = episodeMatch[1];
    const title = $el.find('.subj').text().trim() || null;
    const dateText = $el.find('.date').first().text().trim();
    const txText = $el.find('.tx').text().trim();

    let number = 0;
    const numMatch = txText.match(/#(\d+)/);
    if (numMatch) number = parseInt(numMatch[1], 10);

    let uploadDate: Date | null = null;
    if (dateText) {
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) uploadDate = parsed;
    }

    chapters.push({
      id: `${mangaId}/${episodeNo}`,
      mangaId,
      number,
      title,
      scanlationGroup: null,
      uploadDate,
    });
  });

  return chapters;
}

function parseCardList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('a[data-title-no]').each((_, el) => {
    const $el = $(el);
    const titleNo = $el.attr('data-title-no') || '';
    if (!titleNo || seen.has(titleNo)) return;
    seen.add(titleNo);

    const title =
      $el.find('.info_text .title').first().text().trim() ||
      $el.find('.title').first().text().trim() ||
      '';
    if (!title) return;

    const cover =
      $el.find('.image_wrap img').first().attr('src') ||
      $el.find('img').first().attr('src') ||
      '';
    const authorText = $el.find('.info_text .author').first().text().trim();
    const authors = authorText
      ? authorText.split('/').map((a) => a.trim()).filter(Boolean)
      : [];
    const genreRaw = $el.attr('data-genre') || '';
    const genres = genreRaw ? [genreRaw.toLowerCase()] : [];

    items.push({
      id: titleNo,
      providerId: 'webtoons',
      title,
      alternativeTitles: [],
      description: '',
      cover,
      status: MangaStatus.UNKNOWN,
      genres,
      authors,
      artists: [],
      lastUpdate: null,
    });
  });

  return items;
}

function extractGenreFromUrl(url: string): string[] {
  const match = url.match(/\/en\/([a-z][a-z-]*)\//);
  if (!match) return [];
  const slug = match[1];
  if (
    ['search', 'originals', 'genres', 'ranking', 'canvas', 'community'].includes(slug)
  ) {
    return [];
  }
  return [slug];
}

function parseStatus(text: string): MangaStatus {
  const lower = text.toLowerCase();
  if (lower.includes('ongoing')) return MangaStatus.ONGOING;
  if (lower.includes('completed') || lower.includes('finished')) return MangaStatus.COMPLETED;
  if (lower.includes('hiatus')) return MangaStatus.HIATUS;
  if (lower.includes('cancelled') || lower.includes('canceled')) return MangaStatus.CANCELLED;
  return MangaStatus.UNKNOWN;
}

export class WebtoonsProvider implements Provider {
  readonly id = 'webtoons';
  readonly name = 'Webtoons';
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
    const url = `${BASE_URL}/en/search/originals?keyword=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);
    const items = parseCardList(html);

    const hasMore = items.length >= 30;

    return { data: items, page, totalPages: hasMore ? 0 : 1, hasMore };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const url = detailUrl(mangaId);
    logger.info(`Fetching manga details for ${mangaId}`);
    const { html, finalUrl } = await withRetry(async () => {
      const r = await fetch(url, { headers: HEADERS, redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return { html: await r.text(), finalUrl: r.url };
    });

    const $ = cheerio.load(html);

    const title =
      $('h1.subj').first().text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      'Unknown';

    const description =
      $('p[class*="summary"]').first().text().trim() ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const cover =
      $('meta[property="og:image"]').attr('content') ||
      $('.detail_header img').first().attr('src') ||
      $('.image_wrap img').first().attr('src') ||
      '';

    const genres = extractGenreFromUrl(finalUrl || url);

    const authorText =
      $('meta[property="com-linewebtoon:webtoon:author"]').attr('content') ||
      $('.author_area').text().trim() ||
      '';
    const authors = authorText
      ? authorText.split('/').map((a) => a.trim()).filter(Boolean)
      : [];

    const status = parseStatus($('.detail_info').text());

    return {
      id: mangaId,
      providerId: 'webtoons',
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
    const { html: firstHtml, finalUrl } = await withRetry(async () => {
      const r = await fetch(detailUrl(mangaId), { headers: HEADERS, redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
      return { html: await r.text(), finalUrl: r.url };
    });

    const chapters = parseChapterList(firstHtml, mangaId);
    const seen = new Set(chapters.map((c) => c.id));

    let page = 2;
    while (page <= MAX_LIST_PAGES) {
      const batchEnd = Math.min(page + PAGE_BATCH_SIZE, MAX_LIST_PAGES + 1);
      const batchPages = Array.from({ length: batchEnd - page }, (_, i) => page + i);

      const results = await Promise.allSettled(
        batchPages.map((p) => fetchHtml(`${finalUrl}&page=${p}`))
      );

      let batchAdded = 0;
      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        for (const chapter of parseChapterList(result.value, mangaId)) {
          if (!seen.has(chapter.id)) {
            seen.add(chapter.id);
            chapters.push(chapter);
            batchAdded++;
          }
        }
      }

      if (batchAdded === 0) break;
      page = batchEnd;
      if (page <= MAX_LIST_PAGES) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    return chapters;
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const [titleNo, episodeNo] = chapterId.split('/');
    if (!titleNo || !episodeNo) {
      throw new Error(`Invalid webtoons chapter id: ${chapterId}`);
    }

    const url = viewerUrl(titleNo, episodeNo);
    logger.info(`Fetching chapter pages from ${url}`);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const pages: Page[] = [];
    $('#_imageList img').each((_index, el) => {
      const $el = $(el);
      const src = $el.attr('data-url') || $el.attr('src') || '';
      if (src && src.includes('webtoon-phinf')) {
        pages.push({
          index: pages.length,
          url: src,
          headers: { Referer: IMAGE_REFERER },
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
    const genre = filters?.tags?.map(toGenreSlug).find(Boolean);
    const sortOrder = toSortOrder(filters?.sort);

    let url: string;
    if (genre) {
      url = `${BASE_URL}/en/genres/${genre}`;
      if (sortOrder) url += `?sortOrder=${sortOrder}`;
    } else {
      url = `${BASE_URL}/en/ranking`;
    }

    const html = await fetchHtml(url);
    const items = parseCardList(html);
    return { data: items, page, totalPages: 1, hasMore: false };
  }

  async getLatest(
    page = 1,
    filters?: ProviderFilters
  ): Promise<PaginatedResult<Manga>> {
    const genre = filters?.tags?.map(toGenreSlug).find(Boolean);

    let url: string;
    if (genre) {
      url = `${BASE_URL}/en/genres/${genre}?sortOrder=UPDATE`;
    } else {
      url = `${BASE_URL}/en/originals?sortOrder=UPDATE`;
    }

    const html = await fetchHtml(url);
    const items = parseCardList(html);
    return { data: items, page, totalPages: 1, hasMore: false };
  }
}
