import type { Provider, ProviderFilters } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus, parseMangaStatus } from '@/domain/entities/manga';
import { withRetry } from '@/shared/utils/retry';
import { createLogger } from '@/shared/utils/logger';
import * as cheerio from 'cheerio';

const logger = createLogger('MangaHub');
const BASE_URL = 'https://mangahub.io';
const PAGE_SIZE = 30;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchHtml(url: string): Promise<string> {
  const res = await withRetry(async () => {
    const r = await fetch(url, { headers: HEADERS, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });
  return res.text();
}

function extractSlug(href: string): string {
  const match = href.match(/\/manga\/([^/?#]+)/);
  return match ? match[1] : '';
}

function extractChapterNum(text: string): number {
  const match = text.match(/#(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

interface ParsedMangaItem {
  slug: string;
  title: string;
  cover: string;
  author: string;
  genres: string[];
  status: string;
  latestChapterNum: number;
  hot: boolean;
}

function parseMangaList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('.media').each((_, el) => {
    const $el = $(el);
    const $heading = $el.find('.media-heading');
    const $link = $heading.find('a').first();
    const href = $link.attr('href') || '';
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $link.text().trim() || '';
    const cover = $el.find('.media-left img').attr('src') || '';

    const authorText = $heading.find('small').text().replace(/^by\s*/i, '').trim();

    const $infoSpan = $el.find('.media-body > span').first();
    const infoText = $infoSpan.text();

    const $chapterLink = $infoSpan.find('a').first();
    const chapterHref = $chapterLink.attr('href') || '';
    const latestChapterNum = extractChapterNum($chapterLink.text());

    let status = MangaStatus.UNKNOWN;
    if (/\(ongoing\)/i.test(infoText)) status = MangaStatus.ONGOING;
    else if (/\(completed\)/i.test(infoText)) status = MangaStatus.COMPLETED;
    else if (/\(hiatus\)/i.test(infoText)) status = MangaStatus.HIATUS;
    else if (/\(cancelled\)/i.test(infoText)) status = MangaStatus.CANCELLED;

    const genres: string[] = [];
    $el.find('._12-Zw .label.genre-label').each((_, g) => {
      const name = $(g).text().trim();
      if (name) genres.push(name);
    });

    if (slug && title) {
      items.push({
        id: slug,
        providerId: 'mangahub',
        title,
        alternativeTitles: [],
        description: '',
        cover,
        status,
        genres,
        authors: authorText ? [authorText] : [],
        artists: [],
        lastUpdate: null,
        latestChapter: latestChapterNum > 0 ? latestChapterNum : undefined,
      });
    }
  });

  return items;
}

function hasNextPage(html: string, currentPage: number): boolean {
  const $ = cheerio.load(html);
  return $(`a[href*="page/${currentPage + 1}"]`).length > 0;
}

export class MangahubProvider implements Provider {
  readonly id = 'mangahub';
  readonly name = 'MangaHub';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = BASE_URL;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1, _filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const url = page === 1
      ? `${BASE_URL}/search?q=${encodeURIComponent(query)}`
      : `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const more = hasNextPage(html, page);
    return { data: items, page, totalPages: more ? 0 : page, hasMore: more };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const html = await fetchHtml(`${BASE_URL}/manga/${mangaId}`);
    const $ = cheerio.load(html);

    const $title = $('h1._3xnDj');
    const title = $title.clone().children('small, a, span').remove().end().text().trim() || mangaId;
    const altTitlesText = $title.find('small').text().trim();
    const alternativeTitles = altTitlesText ? altTitlesText.split(/;\s*/).map(s => s.trim()).filter(Boolean) : [];

    const cover = $('img[class*="manga-thumb"]').first().attr('src') ||
      $('meta[property="og:image"]').attr('content') || '';

    const description = $('p.ZyMp7').text().trim() || $('meta[name="description"]').attr('content') || '';

    const authors: string[] = [];
    $('span._3SlhO').each((_, el) => {
      const label = $(el).text().trim().toLowerCase();
      if (label === 'author') {
        const value = $(el).next('span').text().trim();
        if (value) authors.push(...value.split(/;\s*/).map(s => s.trim()).filter(Boolean));
      }
    });

    const genres: string[] = [];
    $('a[href^="/genre/"].label').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const pageText = $('body').text();
    let status = MangaStatus.UNKNOWN;
    const statusMatch = pageText.match(/\((\w+)\)/g);
    if (statusMatch) {
      for (const s of statusMatch) {
        const parsed = parseMangaStatus(s.replace(/[()]/g, ''));
        if (parsed !== MangaStatus.UNKNOWN) {
          status = parsed;
          break;
        }
      }
    }

    return {
      id: mangaId,
      providerId: 'mangahub',
      title,
      alternativeTitles,
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
    const html = await fetchHtml(`${BASE_URL}/manga/${mangaId}`);
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];
    const seen = new Set<number>();

    const slug = mangaId;

    $('a._3pfyN').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/chapter\/[^/]+\/chapter-([\d.]+)/);
      if (!match) return;
      const num = parseFloat(match[1]);
      if (isNaN(num) || seen.has(num)) return;
      seen.add(num);

      const text = $(el).text().trim();

      chapters.push({
        id: `${slug}/${match[1]}`,
        mangaId: slug,
        number: num,
        title: text || null,
        scanlationGroup: null,
        uploadDate: null,
      });
    });

    return chapters.sort((a, b) => b.number - a.number);
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const [slug, chapterNum] = chapterId.split('/');
    const url = `${BASE_URL}/chapter/${slug}/chapter-${chapterNum}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const pages: Page[] = [];
    $('img.PB0mN').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src && src.includes('imgx.mghcdn.com')) {
        pages.push({
          index: pages.length,
          url: src,
          headers: { Referer: BASE_URL },
        });
      }
    });

    return pages;
  }

  async getPopular(page = 1, _filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const url = page === 1 ? `${BASE_URL}/popular` : `${BASE_URL}/popular/page/${page}`;
    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const more = hasNextPage(html, page);
    return { data: items, page, totalPages: more ? 0 : page, hasMore: more };
  }

  async getLatest(page = 1, _filters?: ProviderFilters): Promise<PaginatedResult<Manga>> {
    const url = page === 1 ? `${BASE_URL}/updates` : `${BASE_URL}/updates/page/${page}`;
    const html = await fetchHtml(url);
    const items = parseMangaList(html);
    const more = hasNextPage(html, page);
    return { data: items, page, totalPages: more ? 0 : page, hasMore: more };
  }
}
