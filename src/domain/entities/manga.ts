export enum MangaStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
}

export interface Manga {
  id: string;
  providerId: string;
  title: string;
  alternativeTitles: string[];
  description: string;
  cover: string;
  status: MangaStatus;
  genres: string[];
  authors: string[];
  artists: string[];
  lastUpdate: Date | null;
  latestChapter?: number;
  pageCount?: number;
  category?: string;
  pageThumbnails?: string[];
}

export function parseMangaStatus(raw: string): MangaStatus {
  const normalized = raw.toLowerCase().trim();
  if (normalized.includes('ongoing') || normalized.includes('publishing')) return MangaStatus.ONGOING;
  if (normalized.includes('complete') || normalized.includes('finished')) return MangaStatus.COMPLETED;
  if (normalized.includes('hiatus')) return MangaStatus.HIATUS;
  if (normalized.includes('cancel') || normalized.includes('discontinued')) return MangaStatus.CANCELLED;
  return MangaStatus.UNKNOWN;
}
