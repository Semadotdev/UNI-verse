import type { Provider } from '@/domain/interfaces/provider';
import type { Manga } from '@/domain/entities/manga';
import type { Chapter } from '@/domain/entities/chapter';
import type { Page } from '@/domain/entities/page';
import type { PaginatedResult } from '@/domain/types/api';
import { parseMangaStatus } from '@/domain/entities/manga';
import { withRetry } from '@/shared/utils/retry';

const BASE_URL = 'https://api.mangadex.org';
const CONTENT_RATINGS = 'contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    status: string;
    tags: Array<{ id: string; attributes: { name: Record<string, string> } }>;
    lastChapter: string | null;
    lastVolume: string | null;
    year: number | null;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { name?: string; fileName?: string; [key: string]: unknown };
  }>;
}

interface MangaDexChapter {
  id: string;
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    publishAt: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: Record<string, string>;
  }>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await withRetry(async () => {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'UNI-verse/1.0',
        'Accept': 'application/json',
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });
  return res.json() as Promise<T>;
}

function getTitle(manga: MangaDexManga): string {
  const { title, altTitles } = manga.attributes;
  return title['en'] || title['ja-ro'] || title['ja'] || Object.values(title)[0] ||
    (altTitles.find(t => t['en']) || altTitles[0] || {})['en'] || 'Unknown';
}

function getCover(manga: MangaDexManga): string {
  const coverRel = manga.relationships.find(r => r.type === 'cover_art');
  if (!coverRel?.attributes?.fileName) return '';
  return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
}

function getAuthor(manga: MangaDexManga): string {
  const authorRel = manga.relationships.find(r => r.type === 'author');
  return authorRel?.attributes?.name || '';
}

function getArtist(manga: MangaDexManga): string {
  const artistRel = manga.relationships.find(r => r.type === 'artist');
  return artistRel?.attributes?.name || '';
}

function getTags(manga: MangaDexManga): string[] {
  return manga.attributes.tags
    .map(t => t.attributes.name['en'])
    .filter(Boolean);
}

function mapManga(md: MangaDexManga): Manga {
  return {
    id: md.id,
    providerId: 'mangadex',
    title: getTitle(md),
    alternativeTitles: md.attributes.altTitles
      .map(t => t['ja-ro'] || t['en'] || Object.values(t)[0])
      .filter(Boolean),
    description: md.attributes.description['en'] || '',
    cover: getCover(md),
    status: parseMangaStatus(md.attributes.status),
    genres: getTags(md),
    authors: getAuthor(md) ? [getAuthor(md)] : [],
    artists: getArtist(md) ? [getArtist(md)] : [],
    lastUpdate: null,
  };
}

function mapChapter(ch: MangaDexChapter, mangaId: string): Chapter {
  const group = ch.relationships.find(r => r.type === 'scanlation_group');
  return {
    id: ch.id,
    mangaId,
    number: ch.attributes.chapter ? parseFloat(ch.attributes.chapter) : 0,
    title: ch.attributes.title,
    scanlationGroup: group?.attributes?.name || null,
    uploadDate: new Date(ch.attributes.publishAt),
  };
}

export class MangaDexProvider implements Provider {
  readonly id = 'mangadex';
  readonly name = 'MangaDex';
  readonly version = '1.0.0';
  readonly lang = 'en';
  readonly baseUrl = 'https://mangadex.org';
  readonly hasSearch = true;
  readonly hasPopular = true;
  readonly hasLatest = true;

  async search(query: string, page = 1): Promise<PaginatedResult<Manga>> {
    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `${BASE_URL}/manga?title=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&includes[]=cover_art&includes[]=author&includes[]=artist&order[relevance]=desc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;

    const res = await fetchJson<{ data: MangaDexManga[]; total: number }>(url);
    const totalPages = Math.ceil(res.total / limit);

    return {
      data: res.data.map(mapManga),
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const url = `${BASE_URL}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
    const res = await fetchJson<{ data: MangaDexManga }>(url);
    return mapManga(res.data);
  }

  async getChapterList(mangaId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    let offset = 0;
    const limit = 100;
    let total = Infinity;

    while (offset < total) {
      const url = `${BASE_URL}/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&offset=${offset}&includes[]=scanlation_group&${CONTENT_RATINGS}`;
      const res = await fetchJson<{ data: MangaDexChapter[]; total: number }>(url);
      total = res.total;
      chapters.push(...res.data.map(ch => mapChapter(ch, mangaId)));
      offset += limit;
      if (offset < total) await sleep(250);
    }

    return chapters;
  }

  async getPageList(chapterId: string): Promise<Page[]> {
    const url = `${BASE_URL}/at-home/server/${chapterId}`;
    const res = await fetchJson<{
      result: string;
      baseUrl?: string;
      chapter?: { hash: string; data: string[]; dataSaver: string[] };
    }>(url);

    if (res.result === 'error' || !res.chapter || !res.baseUrl) {
      console.error(`[MangaDex] at-home error for chapter ${chapterId}:`, res);
      return [];
    }

    const { baseUrl, chapter } = res;
    const files = chapter.data?.length ? chapter.data : chapter.dataSaver ?? [];
    return files.map((filename, index) => ({
      index,
      url: `${baseUrl}/data/${chapter.hash}/${filename}`,
      headers: { Referer: 'https://mangadex.org/' },
    }));
  }

  async getPopular(page = 1): Promise<PaginatedResult<Manga>> {
    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `${BASE_URL}/manga?order[followedCount]=desc&availableTranslatedLanguage[]=en&includes[]=cover_art&includes[]=author&includes[]=artist&limit=${limit}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;

    const res = await fetchJson<{ data: MangaDexManga[]; total: number }>(url);
    const totalPages = Math.ceil(res.total / limit);

    return {
      data: res.data.map(mapManga),
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getLatest(page = 1): Promise<PaginatedResult<Manga>> {
    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `${BASE_URL}/manga?order[latestUploadedChapter]=desc&availableTranslatedLanguage[]=en&includes[]=cover_art&includes[]=author&includes[]=artist&limit=${limit}&offset=${offset}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`;

    const res = await fetchJson<{ data: MangaDexManga[]; total: number }>(url);
    const totalPages = Math.ceil(res.total / limit);

    return {
      data: res.data.map(mapManga),
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}
