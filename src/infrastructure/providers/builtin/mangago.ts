import type { Provider } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { MangaStatus } from '@/domain/entities/manga';
import { withRetry } from '@/shared/utils/retry';
import * as cheerio from 'cheerio';
import { createDecipheriv } from 'crypto';

const BASE_URL = 'https://www.mangago.me';

function extractSlug(href: string): string {
  const match = href.match(/\/read-manga\/([^/]+)/);
  return match ? match[1] : href;
}

function extractChapterPath(href: string): string {
  const urlMatch = href.match(/^https?:\/\/[^/]+\/read-manga\/(.+)/);
  if (urlMatch) return urlMatch[1].replace(/\/+$/, '');

  const pathMatch = href.match(/\/read-manga\/(.+)/);
  if (pathMatch) return pathMatch[1].replace(/\/+$/, '');

  return href.replace(/\/+$/, '');
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchHtml(url: string): Promise<string> {
  const res = await withRetry(async () => {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });
  return res.text();
}

const AES_KEY = Buffer.from('e11adc3949ba59abbe56e057f20f883e', 'hex');
const AES_IV = Buffer.from('1234567890abcdef1234567890abcdef', 'hex');

function decryptImgsrcs(payload: string): string[] {
  let cleaned = payload.trim();
  const missingPadding = cleaned.length % 4;
  if (missingPadding) cleaned += '='.repeat(4 - missingPadding);

  const encrypted = Buffer.from(cleaned, 'base64');
  const decipher = createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const text = decrypted.toString('utf8').replace(/\0+$/, '');

  return text.split(',').map(u => u.trim()).filter(u => u && !u.includes('cspiclink'));
}

function parseTotalPages(html: string): number {
  const match = html.match(/<div class="pagination" total="(\d+)">/);
  return match ? parseInt(match[1], 10) : 1;
}

function parseSearchList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('#search_list li, .pic_list li').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a[href*="read-manga/"]').first();
    const href = $link.attr('href') || '';
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $el.find('.tit a, h2 a').first().text().trim() ||
      $el.find('img').attr('alt') || '';
    const cover = $el.find('img').attr('src') || $el.find('img').attr('data-original') || '';

    const author = $el.find('.row-3').text().replace(/^.*?Author:\s*/i, '').trim();
    const genresRaw = $el.find('.row-4').text().replace(/^.*?Genres:\s*/i, '').trim();
    const genres = genresRaw.split(',').map(g => g.trim()).filter(Boolean);

    if (slug && title) {
      items.push({
        id: slug,
        providerId: 'mangago',
        title,
        alternativeTitles: [],
        description: '',
        cover,
        status: MangaStatus.UNKNOWN,
        genres,
        authors: author ? [author] : [],
        artists: [],
        lastUpdate: null,
      });
    }
  });

  return items;
}

function parsePicList(html: string): Manga[] {
  const $ = cheerio.load(html);
  const items: Manga[] = [];
  const seen = new Set<string>();

  $('div.pic_list a[href*="read-manga/"], div.flex1 a[href*="read-manga/"], div.updatesli a[href*="read-manga/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title = $el.attr('title') || $el.find('img').attr('alt') || '';
    const cover = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';

    if (slug && title) {
      items.push({
        id: slug,
        providerId: 'mangago',
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
    }
  });

  return items;
}

export class MangaGoProvider implements Provider {
  readonly id = 'mangago';
  readonly name = 'MangaGo';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = BASE_URL;
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1): Promise<PaginatedResult<Manga>> {
    const url = `${BASE_URL}/r/l_search/?name=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);
    const items = parseSearchList(html);
    const totalPages = parseTotalPages(html);

    return {
      data: items,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const html = await fetchHtml(`${BASE_URL}/read-manga/${mangaId}/`);
    const $ = cheerio.load(html);

    const title = $('h1').first().text().trim() || 'Unknown';
    const cover = $('img.showdesc').attr('data-src') || $('img.showdesc').attr('src') || '';

    const authorRaw = $('table.info tr').filter((_, el) =>
      $(el).find('td').first().text().toLowerCase().includes('author')
    ).find('td').last().text().trim();
    const author = authorRaw || '';

    const genres: string[] = [];
    $('table.info a[href*="genre"], .genre a').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    const statusText = $('table.info tr').filter((_, el) =>
      $(el).find('td').first().text().toLowerCase().includes('status')
    ).find('td').last().text().toLowerCase().trim();

    let status = MangaStatus.UNKNOWN;
    if (statusText.includes('ongoing')) status = MangaStatus.ONGOING;
    else if (statusText.includes('completed')) status = MangaStatus.COMPLETED;
    else if (statusText.includes('hiatus')) status = MangaStatus.HIATUS;

    return {
      id: mangaId,
      providerId: 'mangago',
      title,
      alternativeTitles: [],
      description: '',
      cover,
      status,
      genres,
      authors: author ? [author] : [],
      artists: [],
      lastUpdate: null,
    };
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const html = await fetchHtml(`${BASE_URL}/read-manga/${mangaId}/`);
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];

    $('#chapter_table a.chico, .listing a.chico').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const text = $el.text().trim();
      const numMatch = text.match(/(?:Vol\.?\s*\d+\s+)?Ch\.?\s*(\d+(?:\.\d+)?)/i);
      if (href && numMatch) {
        chapters.push({
          id: extractChapterPath(href),
          mangaId,
          number: parseFloat(numMatch[1]),
          title: text,
          scanlationGroup: null,
          uploadDate: null,
        });
      }
    });

    return chapters.reverse();
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const url = chapterId.startsWith('http')
      ? chapterId
      : `${BASE_URL}/read-manga/${chapterId}/`;
    const html = await fetchHtml(url);

    const imgsrcsMatch = html.match(/var\s+imgsrcs\s*=\s*['"]([^'"]+)['"]/);
    if (imgsrcsMatch) {
      const urls = decryptImgsrcs(imgsrcsMatch[1]);
      return urls.map((imageUrl, i) => ({
        index: i,
        url: imageUrl,
        headers: { Referer: BASE_URL },
      }));
    }

    const $ = cheerio.load(html);
    const pages: Page[] = [];
    $('#contentpage img, .pic_box img').each((i, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src') || '';
      if (src && !src.includes('logo') && !src.includes('banner') && !src.includes('base64')) {
        pages.push({ index: i, url: src, headers: { Referer: BASE_URL } });
      }
    });

    return pages;
  }

  async getPopular(page = 1): Promise<PaginatedResult<Manga>> {
    const url = page === 1 ? `${BASE_URL}/topmanga/` : `${BASE_URL}/topmanga/${page}/`;
    const html = await fetchHtml(url);
    const items = parsePicList(html);

    return { data: items, page, totalPages: 1, hasMore: false };
  }

  async getLatest(page = 1): Promise<PaginatedResult<Manga>> {
    const url = `${BASE_URL}/list/latest/all/${page}/`;
    const html = await fetchHtml(url);
    const items = parseSearchList(html);
    const totalPages = parseTotalPages(html);

    return { data: items, page, totalPages, hasMore: page < totalPages };
  }
}
