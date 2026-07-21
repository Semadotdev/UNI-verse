# Mihon Web — Design Spec

## Overview

A web-based replication of [Mihon](https://github.com/mihonapp/mihon) (formerly Tachiyomi), the popular open-source manga reader. The app enables users to search, browse, and read manga from multiple online sources, manage a personal library, and track reading progress — all from a web browser.

## Architecture

### Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite via Prisma ORM
- **Image Proxy**: Next.js API route for CORS-free image loading
- **State Management**: React Context + hooks (no Redux needed for MVP)

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Next.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Library  │ │  Reader  │ │  Search/Browse    │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
│         ↓ REST API calls                            │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)            │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Auth    │ │  Library │ │  Source Proxy      │   │
│  └──────────┘ └──────────┘ └───────┬───────────┘   │
│                                     ↓                │
│  ┌──────────────────────────────────────────────┐   │
│  │         Source Adapters (Parser Engine)       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │ MangaDex │ │ MangaSee │ │  Custom  │     │   │
│  │  │  (API)   │ │  (Scrape)│ │          │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│  SQLite (Prisma) — users, library, progress, etc.   │
└─────────────────────────────────────────────────────┘
```

### Source Adapters

Each manga source gets a standardized adapter interface:

```typescript
interface SourceAdapter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;

  // Search
  search(query: string, page: number): Promise<SearchResult[]>;
  
  // Browse
  popular(page: number): Promise<SearchResult[]>;
  latest(page: number): Promise<SearchResult[]>;
  byGenre(genre: string, page: number): Promise<SearchResult[]>;
  
  // Manga details
  getManga(mangaId: string): Promise<MangaDetails>;
  getChapters(mangaId: string): Promise<Chapter[]>;
  
  // Reading
  getPages(chapterId: string): Promise<string[]>;
}

interface SearchResult {
  id: string;
  title: string;
  cover: string;
  description?: string;
  status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  genres?: string[];
}

interface MangaDetails extends SearchResult {
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  number: number;
  title?: string;
  date?: string;
}
```

**Built-in sources for MVP:**
1. **MangaDex** — Official REST API, well-documented, no scraping needed
2. **MangaSee** — HTML scraping (popular manga aggregator)

## Data Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  password  String?
  library   Library[]
  history   ReadingHistory[]
  settings  UserSettings?
  createdAt DateTime @default(now())
}

model Library {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  mangaId    String
  sourceId   String
  title      String
  cover      String?
  status     String?
  categories String[]
  addedAt    DateTime @default(now())
  @@unique([userId, mangaId, sourceId])
}

model ReadingHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  mangaId   String
  sourceId  String
  chapterId String
  chapterNum Float?
  readAt    DateTime @default(now())
  progress  Float?
  @@unique([userId, mangaId, chapterId])
}

model Chapter {
  id        String   @id @default(cuid())
  mangaId   String
  sourceId  String
  chapterId String
  number    Float?
  title     String?
  pages     String[]
  @@unique([mangaId, sourceId, chapterId])
}

model UserSettings {
  id             String  @id @default(cuid())
  userId         String  @unique
  user           User    @relation(fields: [userId], references: [id])
  theme          String  @default("system")
  readerMode     String  @default("page")
  readingDir     String  @default("rtl")
  bgColor        String  @default("#ffffff")
  brightness     Float   @default(1.0)
  enabledSources String[]
}
```

## Features (MVP)

### 1. Search & Browse

- Global search across all enabled sources
- Source-specific browsing (popular, latest, by genre)
- Manga detail page with cover, title, description, status, chapter list
- Filter by genre, status, sort order

### 2. Library Management

- Add/remove manga from personal library
- User-created categories ("Reading", "Completed", "Plan to Read")
- Reading list view with progress indicators
- Sort by: last read, date added, title
- Grid/list view toggle

### 3. Reader

- **Page mode** (manga): LTR, RTL, vertical scroll
- **Webtoon mode** (manhwa): continuous vertical scroll with lazy loading
- Settings: brightness filter, background color, page padding
- Gestures: swipe/tap to navigate, pinch to zoom (page mode)
- Preloading: prefetch next 2-3 pages for smooth reading
- Resume: remembers last read position per chapter

### 4. Reading History

- Auto-tracks reading progress
- Continue reading on home page
- History view with recent chapters and timestamps
- Per-manga progress (chapters read / total)

### 5. Source Management

- Source list page: enable/disable sources, health status
- Built-in sources: MangaDex (API), MangaSee (scraper)

## Pages / Routes

| Route | Description |
|-------|-------------|
| `/` | Home — continue reading, recently updated |
| `/search` | Global search |
| `/source/:id` | Browse a specific source |
| `/manga/:sourceId/:mangaId` | Manga detail + chapter list |
| `/read/:sourceId/:mangaId/:chapterId` | Reader |
| `/library` | Personal library |
| `/history` | Reading history |
| `/settings` | User settings |
| `/api/sources` | List available sources |
| `/api/search` | Search across sources |
| `/api/manga/:sourceId/:mangaId` | Get manga details |
| `/api/chapters/:sourceId/:mangaId` | Get chapters |
| `/api/pages/:sourceId/:chapterId` | Get page images |
| `/api/image` | Image proxy |

## Design Tokens

- **Primary**: `#6366f1` (indigo-500)
- **Background**: `#09090b` (zinc-950) / `#ffffff` (light mode)
- **Surface**: `#18181b` (zinc-900) / `#f4f4f5` (zinc-100)
- **Text**: `#fafafa` (zinc-50) / `#09090b` (zinc-950)
- **Accent**: `#8b5cf6` (violet-500)
- **Font**: Inter (UI), system-ui fallback

## Out of Scope (MVP)

- User authentication / accounts (start with single-user local mode)
- Tracker integration (MAL, AniList, etc.)
- Backup/restore
- Scheduled library updates
- Custom source management
- Multi-user support
- PWA / offline support

## Future Phases

1. **Phase 2**: Auth (email/password or OAuth), multi-user
2. **Phase 3**: Tracker integration (MAL, AniList, Kitsu)
3. **Phase 4**: Backup/restore, scheduled updates
4. **Phase 5**: Custom source support, advanced filters
5. **Phase 6**: PWA, offline reading, notifications
