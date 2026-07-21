# Mihon Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based manga reader replicating Mihon's core features — search/browse from multiple sources, personal library, configurable reader, and reading history.

**Architecture:** Next.js 14 App Router with TypeScript. Backend proxy pattern: API routes handle source fetching/scraping to avoid CORS issues. SQLite via Prisma for user data. Source adapter system for pluggable manga sources.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma (SQLite), React Context

---

## File Structure

```
mihon-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home page
│   │   ├── search/page.tsx         # Search page
│   │   ├── source/[id]/page.tsx    # Browse source
│   │   ├── manga/[sourceId]/[mangaId]/page.tsx  # Manga detail
│   │   ├── read/[sourceId]/[mangaId]/[chapterId]/page.tsx  # Reader
│   │   ├── library/page.tsx        # Library page
│   │   ├── history/page.tsx        # History page
│   │   ├── settings/page.tsx       # Settings page
│   │   └── api/
│   │       ├── sources/route.ts    # List sources
│   │       ├── search/route.ts     # Search across sources
│   │       ├── manga/[sourceId]/[mangaId]/route.ts  # Manga details
│   │       ├── chapters/[sourceId]/[mangaId]/route.ts  # Chapters
│   │       ├── pages/[sourceId]/[chapterId]/route.ts  # Page images
│   │       ├── image/route.ts      # Image proxy
│   │       ├── library/route.ts    # Library CRUD
│   │       └── history/route.ts    # History CRUD
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── manga/
│   │   │   ├── MangaCard.tsx
│   │   │   ├── MangaGrid.tsx
│   │   │   ├── MangaDetail.tsx
│   │   │   └── ChapterList.tsx
│   │   ├── reader/
│   │   │   ├── PageReader.tsx
│   │   │   ├── WebtoonReader.tsx
│   │   │   ├── ReaderControls.tsx
│   │   │   └── ReaderSettings.tsx
│   │   ├── library/
│   │   │   ├── LibraryGrid.tsx
│   │   │   ├── LibraryFilters.tsx
│   │   │   └── CategoryManager.tsx
│   │   └── search/
│   │       ├── SearchBar.tsx
│   │       └── SearchResults.tsx
│   ├── lib/
│   │   ├── db.ts                   # Prisma client
│   │   ├── sources/
│   │   │   ├── types.ts            # SourceAdapter interface
│   │   │   ├── registry.ts         # Source registry
│   │   │   ├── mangadex.ts         # MangaDex adapter
│   │   │   └── mangasee.ts         # MangaSee adapter
│   │   ├── image-proxy.ts          # Image proxy utils
│   │   └── utils.ts                # General utilities
│   ├── contexts/
│   │   ├── LibraryContext.tsx
│   │   ├── ReaderContext.tsx
│   │   └── SettingsContext.tsx
│   └── hooks/
│       ├── useSearch.ts
│       ├── useManga.ts
│       └── useReader.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## Phase 1: Project Setup

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest mihon-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] **Step 2: Navigate to project**

```bash
cd mihon-web
```

- [ ] **Step 3: Install dependencies**

```bash
npm install prisma @prisma/client lucide-react clsx tailwind-merge
npm install -D @types/node
```

- [ ] **Step 4: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 5: Update tailwind.config.ts with design tokens**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        accent: "#8b5cf6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript, Tailwind, Prisma"
```

---

### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Write Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String?
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
  categories String
  addedAt    DateTime @default(now())
  @@unique([userId, mangaId, sourceId])
}

model ReadingHistory {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  mangaId    String
  sourceId   String
  chapterId  String
  chapterNum Float?
  readAt     DateTime @default(now())
  progress   Float?
  @@unique([userId, mangaId, chapterId])
}

model Chapter {
  id        String   @id @default(cuid())
  mangaId   String
  sourceId  String
  chapterId String
  number    Float?
  title     String?
  pages     String
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
  enabledSources String
}
```

- [ ] **Step 2: Create Prisma client singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with SQLite database"
```

---

## Phase 2: Source Adapter System

### Task 3: Source Adapter Types

**Files:**
- Create: `src/lib/sources/types.ts`

- [ ] **Step 1: Define source adapter interface**

```typescript
// src/lib/sources/types.ts
export interface SearchResult {
  id: string;
  title: string;
  cover: string;
  description?: string;
  status?: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres?: string[];
}

export interface MangaDetails extends SearchResult {
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title?: string;
  date?: string;
}

export interface SourceAdapter {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;

  search(query: string, page: number): Promise<SearchResult[]>;
  popular(page: number): Promise<SearchResult[]>;
  latest(page: number): Promise<SearchResult[]>;
  byGenre(genre: string, page: number): Promise<SearchResult[]>;
  getManga(mangaId: string): Promise<MangaDetails>;
  getChapters(mangaId: string): Promise<Chapter[]>;
  getPages(chapterId: string): Promise<string[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sources/types.ts
git commit -m "feat: add SourceAdapter interface and types"
```

---

### Task 4: Source Registry

**Files:**
- Create: `src/lib/sources/registry.ts`
- Create: `src/lib/sources/mangadex.ts` (stub)
- Create: `src/lib/sources/mangasee.ts` (stub)

- [ ] **Step 1: Create source registry**

```typescript
// src/lib/sources/registry.ts
import { SourceAdapter } from "./types";
import { MangaDexSource } from "./mangadex";
import { MangaSeeSource } from "./mangasee";

const sources: Map<string, SourceAdapter> = new Map();

export function registerSource(source: SourceAdapter): void {
  sources.set(source.id, source);
}

export function getSource(id: string): SourceAdapter | undefined {
  return sources.get(id);
}

export function getAllSources(): SourceAdapter[] {
  return Array.from(sources.values());
}

export function getEnabledSources(): SourceAdapter[] {
  return Array.from(sources.values()).filter((s) => s.enabled);
}

// Initialize built-in sources
registerSource(new MangaDexSource());
registerSource(new MangaSeeSource());
```

- [ ] **Step 2: Create MangaDex stub**

```typescript
// src/lib/sources/mangadex.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

export class MangaDexSource implements SourceAdapter {
  id = "mangadex";
  name = "MangaDex";
  icon = "/icons/mangadex.svg";
  enabled = true;

  async search(query: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async popular(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async latest(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    throw new Error("Not implemented");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Not implemented");
  }

  async getPages(chapterId: string): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
```

- [ ] **Step 3: Create MangaSee stub**

```typescript
// src/lib/sources/mangasee.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

export class MangaSeeSource implements SourceAdapter {
  id = "mangasee";
  name = "MangaSee";
  icon = "/icons/mangasee.svg";
  enabled = true;

  async search(query: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async popular(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async latest(page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    throw new Error("Not implemented");
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    throw new Error("Not implemented");
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    throw new Error("Not implemented");
  }

  async getPages(chapterId: string): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/sources/
git commit -m "feat: add source adapter registry with MangaDex and MangaSee stubs"
```

---

### Task 5: MangaDex Source Adapter

**Files:**
- Modify: `src/lib/sources/mangadex.ts`

- [ ] **Step 1: Implement MangaDex API client**

```typescript
// src/lib/sources/mangadex.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

const BASE_URL = "https://api.mangadex.org";

interface MangaDexManga {
  id: string;
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: string;
    tags: Array<{ attributes: { name: Record<string, string> } }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: { fileName?: string };
  }>;
}

interface MangaDexChapter {
  id: string;
  attributes: {
    chapter: string;
    title: string;
    publishAt: string;
  };
}

export class MangaDexSource implements SourceAdapter {
  id = "mangadex";
  name = "MangaDex";
  icon = "/icons/mangadex.svg";
  enabled = true;

  private getEnglishTitle(manga: MangaDexManga): string {
    return manga.attributes.title.en || 
           Object.values(manga.attributes.title)[0] || 
           "Unknown";
  }

  private getCoverArt(manga: MangaDexManga): string {
    const cover = manga.relationships.find((r) => r.type === "cover_art");
    if (cover?.attributes?.fileName) {
      return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`;
    }
    return "/placeholder.png";
  }

  private getStatus(status: string): SearchResult["status"] {
    const statusMap: Record<string, SearchResult["status"]> = {
      ongoing: "ongoing",
      completed: "completed",
      hiatus: "hiatus",
      cancelled: "cancelled",
    };
    return statusMap[status] || "ongoing";
  }

  private getGenres(manga: MangaDexManga): string[] {
    return manga.attributes.tags.map(
      (tag) => tag.attributes.name.en || Object.values(tag.attributes.name)[0]
    );
  }

  async search(query: string, page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      title: query,
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[relevance]": "desc",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async popular(page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[followedCount]": "desc",
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async latest(page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "order[latestUploadedChapter]": "desc",
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      limit: "20",
      offset: ((page - 1) * 20).toString(),
      "includes[]": "cover_art",
      "includedTags[]": genre,
      "availableTranslatedLanguage[]": "en",
    });

    const res = await fetch(`${BASE_URL}/manga?${params}`);
    const data = await res.json();

    return data.data.map((manga: MangaDexManga) => ({
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
    }));
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const params = new URLSearchParams({
      "includes[]": "cover_art",
    });

    const res = await fetch(`${BASE_URL}/manga/${mangaId}?${params}`);
    const data = await res.json();
    const manga = data.data as MangaDexManga;

    const chapters = await this.getChapters(mangaId);

    return {
      id: manga.id,
      title: this.getEnglishTitle(manga),
      cover: this.getCoverArt(manga),
      description: manga.attributes.description.en || "",
      status: this.getStatus(manga.attributes.status),
      genres: this.getGenres(manga),
      chapters,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        manga: mangaId,
        limit: "100",
        offset: offset.toString(),
        "translatedLanguage[]": "en",
        "order[chapter]": "asc",
      });

      const res = await fetch(`${BASE_URL}/chapter?${params}`);
      const data = await res.json();

      const batch = data.data.map((ch: MangaDexChapter) => ({
        id: ch.id,
        number: parseFloat(ch.attributes.chapter) || 0,
        title: ch.attributes.title,
        date: ch.attributes.publishAt,
      }));

      chapters.push(...batch);
      offset += 100;
      hasMore = batch.length === 100;
    }

    return chapters;
  }

  async getPages(chapterId: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
    const data = await res.json();

    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const dataFiles = data.chapter.data;

    return dataFiles.map(
      (file: string) => `${baseUrl}/data/${hash}/${file}`
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sources/mangadex.ts
git commit -m "feat: implement MangaDex source adapter"
```

---

### Task 6: MangaSee Source Adapter

**Files:**
- Modify: `src/lib/sources/mangasee.ts`

- [ ] **Step 1: Implement MangaSee scraper**

```typescript
// src/lib/sources/mangasee.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

const BASE_URL = "https://mangasee123.com";

export class MangaSeeSource implements SourceAdapter {
  id = "mangasee";
  name = "MangaSee";
  icon = "/icons/mangasee.svg";
  enabled = true;

  async search(query: string, page: number): Promise<SearchResult[]> {
    const res = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async popular(page: number): Promise<SearchResult[]> {
    const res = await fetch(`${BASE_URL}/directory/?page=${page}`);
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async latest(page: number): Promise<SearchResult[]> {
    const res = await fetch(`${BASE_URL}/directory/?page=${page}&sort=latest`);
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    const res = await fetch(
      `${BASE_URL}/directory/${genre}?page=${page}`
    );
    const html = await res.text();
    return this.parseSearchResults(html);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    const html = await res.text();
    return this.parseMangaDetails(html, mangaId);
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    const html = await res.text();
    return this.parseChapters(html);
  }

  async getPages(chapterId: string): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/chapter/${chapterId}`);
    const html = await res.text();
    return this.parsePages(html);
  }

  private parseSearchResults(html: string): SearchResult[] {
    const results: SearchResult[] = [];
    const regex =
      /<a[^>]*class="[^"]*SeriesList[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      results.push({
        id: match[1].split("/").pop() || "",
        title: match[3].trim(),
        cover: match[2],
      });
    }

    return results;
  }

  private parseMangaDetails(html: string, mangaId: string): MangaDetails {
    const titleMatch = html.match(
      /<h1[^>]*class="[^"]*SeriesName[^"]*"[^>]*>([^<]*)<\/h1>/
    );
    const descMatch = html.match(
      /<div[^>]*class="[^"]*Summary[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );
    const statusMatch = html.match(
      /<div[^>]*class="[^"]*Status[^"]*"[^>]*>[^<]*<span[^>]*>([^<]*)<\/span>/
    );
    const coverMatch = html.match(
      /<img[^>]*class="[^"]*SeriesProfileImage[^"]*"[^>]*src="([^"]*)"/
    );

    const chapters = this.parseChapters(html);

    return {
      id: mangaId,
      title: titleMatch?.[1]?.trim() || "Unknown",
      cover: coverMatch?.[1] || "/placeholder.png",
      description: descMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || "",
      status: (statusMatch?.[1]?.toLowerCase() as SearchResult["status"]) || "ongoing",
      chapters,
    };
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const regex =
      /<a[^>]*class="[^"]*ChapterLink[^"]*"[^>]*href="([^"]*)"[^>]*>[\s\S]*?<span[^>]*>([^<]*)<\/span>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const numMatch = match[2].match(/Chapter\s*([\d.]+)/i);
      chapters.push({
        id: match[1].split("/").pop() || "",
        number: numMatch ? parseFloat(numMatch[1]) : 0,
        title: match[2].trim(),
      });
    }

    return chapters.reverse();
  }

  private parsePages(html: string): string[] {
    const pages: string[] = [];
    const regex =
      /<img[^>]*class="[^"]*PageImage[^"]*"[^>]*src="([^"]*)"/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      pages.push(match[1]);
    }

    return pages;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sources/mangasee.ts
git commit -m "feat: implement MangaSee source adapter with HTML scraping"
```

---

## Phase 3: API Routes

### Task 7: Sources API

**Files:**
- Create: `src/app/api/sources/route.ts`

- [ ] **Step 1: Create sources API route**

```typescript
// src/app/api/sources/route.ts
import { NextResponse } from "next/server";
import { getAllSources } from "@/lib/sources/registry";

export async function GET() {
  const sources = getAllSources().map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    enabled: s.enabled,
  }));

  return NextResponse.json(sources);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sources/route.ts
git commit -m "feat: add sources API route"
```

---

### Task 8: Search API

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Create search API route**

```typescript
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEnabledSources } from "@/lib/sources/registry";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const sources = getEnabledSources();
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const items = await source.search(query, page);
        return { source: source.id, sourceName: source.name, items };
      } catch {
        return { source: source.id, sourceName: source.name, items: [], error: "Failed" };
      }
    })
  );

  return NextResponse.json(results);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/search/route.ts
git commit -m "feat: add search API route"
```

---

### Task 9: Manga & Chapters API

**Files:**
- Create: `src/app/api/manga/[sourceId]/[mangaId]/route.ts`
- Create: `src/app/api/chapters/[sourceId]/[mangaId]/route.ts`
- Create: `src/app/api/pages/[sourceId]/[chapterId]/route.ts`

- [ ] **Step 1: Create manga detail API**

```typescript
// src/app/api/manga/[sourceId]/[mangaId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceId: string; mangaId: string } }
) {
  const source = getSource(params.sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  try {
    const manga = await source.getManga(params.mangaId);
    return NextResponse.json(manga);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch manga" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create chapters API**

```typescript
// src/app/api/chapters/[sourceId]/[mangaId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceId: string; mangaId: string } }
) {
  const source = getSource(params.sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  try {
    const chapters = await source.getChapters(params.mangaId);
    return NextResponse.json(chapters);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create pages API**

```typescript
// src/app/api/pages/[sourceId]/[chapterId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: { sourceId: string; chapterId: string } }
) {
  const source = getSource(params.sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  try {
    const pages = await source.getPages(params.chapterId);
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add manga, chapters, and pages API routes"
```

---

### Task 10: Image Proxy

**Files:**
- Create: `src/app/api/image/route.ts`

- [ ] **Step 1: Create image proxy route**

```typescript
// src/app/api/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: new URL(url).origin,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to proxy image" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/image/route.ts
git commit -m "feat: add image proxy route for CORS-free image loading"
```

---

### Task 11: Library & History API

**Files:**
- Create: `src/app/api/library/route.ts`
- Create: `src/app/api/history/route.ts`

- [ ] **Step 1: Create library API**

```typescript
// src/app/api/library/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const library = await db.library.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(library);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId, title, cover, status, categories } = body;

  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const item = await db.library.upsert({
    where: {
      userId_mangaId_sourceId: {
        userId: DEFAULT_USER_ID,
        mangaId,
        sourceId,
      },
    },
    update: { title, cover, status, categories: categories?.join(",") || "" },
    create: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
      title,
      cover,
      status,
      categories: categories?.join(",") || "",
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId } = body;

  await db.library.deleteMany({
    where: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
    },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create history API**

```typescript
// src/app/api/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const history = await db.readingHistory.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { readAt: "desc" },
    take: 50,
  });

  return NextResponse.json(history);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId, chapterId, chapterNum, progress } = body;

  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const item = await db.readingHistory.upsert({
    where: {
      userId_mangaId_chapterId: {
        userId: DEFAULT_USER_ID,
        mangaId,
        chapterId,
      },
    },
    update: { chapterNum, progress, readAt: new Date() },
    create: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
      chapterId,
      chapterNum,
      progress,
    },
  });

  return NextResponse.json(item);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/library/route.ts src/app/api/history/route.ts
git commit -m "feat: add library and history API routes"
```

---

## Phase 4: UI Components

### Task 12: Utility Components

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Spinner.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create utility function**

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create Button component**

```typescript
// src/components/ui/Button.tsx
"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "primary",
            "bg-zinc-800 text-zinc-100 hover:bg-zinc-700": variant === "secondary",
            "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 3: Create Input component**

```typescript
// src/components/ui/Input.tsx
"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm",
          "text-zinc-100 placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
```

- [ ] **Step 4: Create Card component**

```typescript
// src/components/ui/Card.tsx
"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-zinc-800 bg-zinc-900 p-4",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
```

- [ ] **Step 5: Create Spinner component**

```typescript
// src/components/ui/Spinner.tsx
"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-zinc-600 border-t-primary",
        {
          "h-4 w-4": size === "sm",
          "h-8 w-8": size === "md",
          "h-12 w-12": size === "lg",
        },
        className
      )}
    />
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts
git commit -m "feat: add base UI components (Button, Input, Card, Spinner)"
```

---

### Task 13: Layout Components

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/app/layout.tsx` (modify)

- [ ] **Step 1: Create Navbar component**

```typescript
// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, BookOpen, Clock, Settings, Library } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update root layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mihon Web",
  description: "A web-based manga reader",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100`}>
        <Navbar />
        <main className="pb-20 pt-4 md:pb-4 md:pt-20">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx
git commit -m "feat: add navbar and update root layout"
```

---

### Task 14: Manga Components

**Files:**
- Create: `src/components/manga/MangaCard.tsx`
- Create: `src/components/manga/MangaGrid.tsx`

- [ ] **Step 1: Create MangaCard component**

```typescript
// src/components/manga/MangaCard.tsx
"use client";

import Link from "next/link";
import { SearchResult } from "@/lib/sources/types";

interface MangaCardProps {
  manga: SearchResult;
  sourceId: string;
}

export function MangaCard({ manga, sourceId }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${sourceId}/${manga.id}`}
      className="group relative overflow-hidden rounded-lg bg-zinc-900 transition-transform hover:scale-105"
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={`/api/image?url=${encodeURIComponent(manga.cover)}`}
          alt={manga.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-white">
          {manga.title}
        </h3>
        {manga.status && (
          <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
            {manga.status}
          </span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create MangaGrid component**

```typescript
// src/components/manga/MangaGrid.tsx
import { SearchResult } from "@/lib/sources/types";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  manga: SearchResult[];
  sourceId: string;
}

export function MangaGrid({ manga, sourceId }: MangaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {manga.map((item) => (
        <MangaCard key={item.id} manga={item} sourceId={sourceId} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/manga/
git commit -m "feat: add MangaCard and MangaGrid components"
```

---

### Task 15: Reader Components

**Files:**
- Create: `src/components/reader/PageReader.tsx`
- Create: `src/components/reader/WebtoonReader.tsx`
- Create: `src/components/reader/ReaderControls.tsx`

- [ ] **Step 1: Create PageReader component**

```typescript
// src/components/reader/PageReader.tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PageReaderProps {
  pages: string[];
  direction?: "ltr" | "rtl";
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export function PageReader({
  pages,
  direction = "rtl",
  initialPage = 0,
  onPageChange,
}: PageReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  const goNext = () => {
    if (direction === "rtl") {
      setCurrentPage((p) => Math.max(0, p - 1));
    } else {
      setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
    }
  };

  const goPrev = () => {
    if (direction === "rtl") {
      setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
    } else {
      setCurrentPage((p) => Math.max(0, p - 1));
    }
  };

  if (pages.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        No pages available
      </div>
    );
  }

  return (
    <div className="relative flex h-[80vh] items-center justify-center">
      <img
        src={`/api/image?url=${encodeURIComponent(pages[currentPage])}`}
        alt={`Page ${currentPage + 1}`}
        className="max-h-full max-w-full object-contain"
      />
      <button
        onClick={goNext}
        className="absolute left-0 top-0 h-full w-1/3 opacity-0 hover:opacity-100"
        aria-label="Previous page"
      />
      <button
        onClick={goPrev}
        className="absolute right-0 top-0 h-full w-1/3 opacity-0 hover:opacity-100"
        aria-label="Next page"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        {currentPage + 1} / {pages.length}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create WebtoonReader component**

```typescript
// src/components/reader/WebtoonReader.tsx
"use client";

import { useEffect, useRef } from "react";

interface WebtoonReaderProps {
  pages: string[];
  onProgress?: (progress: number) => void;
}

export function WebtoonReader({ pages, onProgress }: WebtoonReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollTop / (scrollHeight - clientHeight);
      onProgress?.(Math.min(1, Math.max(0, progress)));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onProgress]);

  if (pages.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        No pages available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[80vh] overflow-y-auto">
      <div className="mx-auto max-w-3xl">
        {pages.map((page, index) => (
          <img
            key={index}
            src={`/api/image?url=${encodeURIComponent(page)}`}
            alt={`Page ${index + 1}`}
            className="w-full"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ReaderControls component**

```typescript
// src/components/reader/ReaderControls.tsx
"use client";

import { Settings, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReaderControlsProps {
  direction: "ltr" | "rtl";
  onDirectionChange: (dir: "ltr" | "rtl") => void;
  onSettingsClick: () => void;
}

export function ReaderControls({
  direction,
  onDirectionChange,
  onSettingsClick,
}: ReaderControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDirectionChange(direction === "ltr" ? "rtl" : "ltr")}
      >
        {direction === "ltr" ? (
          <ArrowRight className="h-4 w-4" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={onSettingsClick}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/reader/
git commit -m "feat: add reader components (PageReader, WebtoonReader, Controls)"
```

---

## Phase 5: Pages

### Task 16: Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create home page**

```typescript
// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { getSource } from "@/lib/sources/registry";

export default function HomePage() {
  const [popular, setPopular] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [popularRes, latestRes] = await Promise.all([
          fetch("/api/search?q=&page=1"), // Will use popular endpoint
          fetch("/api/search?q=&page=1"),
        ]);
        // For now, use search with empty query as placeholder
        const [popularData, latestData] = await Promise.all([
          fetch("/api/sources").then((r) => r.json()),
          fetch("/api/sources").then((r) => r.json()),
        ]);
        setPopular([]);
        setLatest([]);
      } catch (error) {
        console.error("Failed to load:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Popular</h2>
          <Link href="/search" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {popular.length > 0 ? (
          <MangaGrid manga={popular} sourceId="mangadex" />
        ) : (
          <p className="text-zinc-500">No manga found</p>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest Updates</h2>
          <Link href="/search" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        {latest.length > 0 ? (
          <MangaGrid manga={latest} sourceId="mangadex" />
        ) : (
          <p className="text-zinc-500">No manga found</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with popular and latest sections"
```

---

### Task 17: Search Page

**Files:**
- Create: `src/app/search/page.tsx`
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/SearchResults.tsx`

- [ ] **Step 1: Create SearchBar component**

```typescript
// src/components/search/SearchBar.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search manga..."
        className="pl-10"
      />
    </form>
  );
}
```

- [ ] **Step 2: Create SearchResults component**

```typescript
// src/components/search/SearchResults.tsx
import { MangaGrid } from "@/components/manga/MangaGrid";

interface SourceResults {
  source: string;
  sourceName: string;
  items: any[];
}

interface SearchResultsProps {
  results: SourceResults[];
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="space-y-8">
      {results.map((source) => (
        <section key={source.source}>
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">
            {source.sourceName}
          </h3>
          {source.items.length > 0 ? (
            <MangaGrid manga={source.items} sourceId={source.source} />
          ) : (
            <p className="text-zinc-500">No results from this source</p>
          )}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create search page**

```typescript
// src/app/search/page.tsx
"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { Spinner } from "@/components/ui/Spinner";

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <div className="mb-8 max-w-xl">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : searched ? (
        <SearchResults results={results} />
      ) : (
        <p className="text-center text-zinc-500">
          Search for manga across multiple sources
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/search/ src/components/search/
git commit -m "feat: add search page with multi-source search"
```

---

### Task 18: Manga Detail Page

**Files:**
- Create: `src/app/manga/[sourceId]/[mangaId]/page.tsx`
- Create: `src/components/manga/MangaDetail.tsx`
- Create: `src/components/manga/ChapterList.tsx`

- [ ] **Step 1: Create MangaDetail component**

```typescript
// src/components/manga/MangaDetail.tsx
"use client";

import { MangaDetails } from "@/lib/sources/types";
import { Button } from "@/components/ui/Button";
import { Plus, Check } from "lucide-react";

interface MangaDetailProps {
  manga: MangaDetails;
  sourceId: string;
  isInLibrary: boolean;
  onLibraryToggle: () => void;
}

export function MangaDetail({
  manga,
  sourceId,
  isInLibrary,
  onLibraryToggle,
}: MangaDetailProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="w-full flex-shrink-0 md:w-64">
        <img
          src={`/api/image?url=${encodeURIComponent(manga.cover)}`}
          alt={manga.title}
          className="w-full rounded-lg object-cover shadow-lg"
        />
      </div>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold">{manga.title}</h1>
        {manga.status && (
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">
            {manga.status}
          </span>
        )}
        {manga.description && (
          <p className="mb-4 text-zinc-400">{manga.description}</p>
        )}
        {manga.genres && manga.genres.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {manga.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        <Button onClick={onLibraryToggle} variant={isInLibrary ? "secondary" : "primary"}>
          {isInLibrary ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              In Library
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add to Library
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ChapterList component**

```typescript
// src/components/manga/ChapterList.tsx
"use client";

import Link from "next/link";
import { Chapter } from "@/lib/sources/types";

interface ChapterListProps {
  chapters: Chapter[];
  sourceId: string;
  mangaId: string;
}

export function ChapterList({ chapters, sourceId, mangaId }: ChapterListProps) {
  return (
    <div className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">Chapters</h2>
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/read/${sourceId}/${mangaId}/${chapter.id}`}
            className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800"
          >
            <div>
              <span className="font-medium">Chapter {chapter.number}</span>
              {chapter.title && (
                <span className="ml-2 text-zinc-400">- {chapter.title}</span>
              )}
            </div>
            {chapter.date && (
              <span className="text-sm text-zinc-500">
                {new Date(chapter.date).toLocaleDateString()}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create manga detail page**

```typescript
// src/app/manga/[sourceId]/[mangaId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MangaDetail } from "@/components/manga/MangaDetail";
import { ChapterList } from "@/components/manga/ChapterList";
import { Spinner } from "@/components/ui/Spinner";
import { MangaDetails } from "@/lib/sources/types";

export default function MangaPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;

  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/manga/${sourceId}/${mangaId}`);
        const data = await res.json();
        setManga(data);
      } catch (error) {
        console.error("Failed to load manga:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceId, mangaId]);

  const handleLibraryToggle = async () => {
    if (!manga) return;

    if (isInLibrary) {
      await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId, sourceId }),
      });
      setIsInLibrary(false);
    } else {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          sourceId,
          title: manga.title,
          cover: manga.cover,
          status: manga.status,
        }),
      });
      setIsInLibrary(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        Manga not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <MangaDetail
        manga={manga}
        sourceId={sourceId}
        isInLibrary={isInLibrary}
        onLibraryToggle={handleLibraryToggle}
      />
      <ChapterList
        chapters={manga.chapters}
        sourceId={sourceId}
        mangaId={mangaId}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/manga/ src/components/manga/MangaDetail.tsx src/components/manga/ChapterList.tsx
git commit -m "feat: add manga detail page with chapter list and library toggle"
```

---

### Task 19: Reader Page

**Files:**
- Create: `src/app/read/[sourceId]/[mangaId]/[chapterId]/page.tsx`

- [ ] **Step 1: Create reader page**

```typescript
// src/app/read/[sourceId]/[mangaId]/[chapterId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageReader } from "@/components/reader/PageReader";
import { WebtoonReader } from "@/components/reader/WebtoonReader";
import { ReaderControls } from "@/components/reader/ReaderControls";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";

export default function ReadPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerMode, setReaderMode] = useState<"page" | "webtoon">("page");
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pages/${sourceId}/${chapterId}`);
        const data = await res.json();
        setPages(data);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceId, chapterId]);

  const handlePageChange = (page: number) => {
    // Track reading progress
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mangaId,
        sourceId,
        chapterId,
        progress: page / Math.max(1, pages.length - 1),
      }),
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/manga/${sourceId}/${mangaId}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <ReaderControls
          direction={direction}
          onDirectionChange={setDirection}
          onSettingsClick={() =>
            setReaderMode(readerMode === "page" ? "webtoon" : "page")
          }
        />
      </div>

      {readerMode === "page" ? (
        <PageReader
          pages={pages}
          direction={direction}
          onPageChange={handlePageChange}
        />
      ) : (
        <WebtoonReader pages={pages} onProgress={handlePageChange} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/read/
git commit -m "feat: add reader page with page and webtoon modes"
```

---

### Task 20: Library Page

**Files:**
- Create: `src/app/library/page.tsx`

- [ ] **Step 1: Create library page**

```typescript
// src/app/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export default function LibraryPage() {
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/library");
        const data = await res.json();
        setLibrary(data);
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredLibrary = filter
    ? library.filter((item) => item.categories.split(",").includes(filter))
    : library;

  const categories = [
    ...new Set(library.flatMap((item) => item.categories.split(",").filter(Boolean))),
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Library</h1>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === null ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {filteredLibrary.length > 0 ? (
        <MangaGrid
          manga={filteredLibrary.map((item) => ({
            id: item.mangaId,
            title: item.title,
            cover: item.cover || "",
            status: item.status,
          }))}
          sourceId={filteredLibrary[0]?.sourceId || "mangadex"}
        />
      ) : (
        <p className="text-center text-zinc-500">
          Your library is empty. Search and add manga to get started!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/library/
git commit -m "feat: add library page with category filtering"
```

---

### Task 21: History Page

**Files:**
- Create: `src/app/history/page.tsx`

- [ ] **Step 1: Create history page**

```typescript
// src/app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  mangaId: string;
  sourceId: string;
  chapterId: string;
  chapterNum: number | null;
  readAt: string;
  progress: number | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Reading History</h1>

      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => (
            <Link
              key={item.id}
              href={`/read/${item.sourceId}/${item.mangaId}/${item.chapterId}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="font-medium">Chapter {item.chapterNum || "?"}</p>
                  <p className="text-sm text-zinc-400">{item.sourceId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">
                  {new Date(item.readAt).toLocaleDateString()}
                </p>
                {item.progress !== null && (
                  <p className="text-xs text-zinc-500">
                    {Math.round(item.progress * 100)}%
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-zinc-500">
          No reading history yet. Start reading to track your progress!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/history/
git commit -m "feat: add reading history page"
```

---

### Task 22: Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Create settings page**

```typescript
// src/app/settings/page.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [readerMode, setReaderMode] = useState("page");
  const [readingDir, setReadingDir] = useState("rtl");

  return (
    <div className="mx-auto max-w-2xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Theme</label>
              <div className="flex gap-2">
                {["light", "dark", "system"].map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setTheme(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Reader</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Default Mode
              </label>
              <div className="flex gap-2">
                {["page", "webtoon"].map((mode) => (
                  <Button
                    key={mode}
                    variant={readerMode === mode ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setReaderMode(mode)}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Reading Direction
              </label>
              <div className="flex gap-2">
                {["ltr", "rtl"].map((dir) => (
                  <Button
                    key={dir}
                    variant={readingDir === dir ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setReadingDir(dir)}
                  >
                    {dir.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">About</h2>
          <p className="text-zinc-400">
            Mihon Web - A web-based manga reader
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/
git commit -m "feat: add settings page"
```

---

## Phase 6: Polish & Testing

### Task 23: Loading States & Error Handling

**Files:**
- Modify: Various page files

- [ ] **Step 1: Add error boundaries**

Create `src/app/error.tsx`:

```typescript
// src/app/error.tsx
"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-zinc-400">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

- [ ] **Step 2: Add not found page**

Create `src/app/not-found.tsx`:

```typescript
// src/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">Page not found</h2>
      <p className="text-zinc-400">The page you are looking for does not exist.</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx
git commit -m "feat: add error boundary and not found pages"
```

---

### Task 24: Final Testing

- [ ] **Step 1: Run development server**

```bash
npm run dev
```

- [ ] **Step 2: Test all pages manually**

Visit each route and verify:
- `/` - Home loads, shows popular/latest sections
- `/search` - Search works across sources
- `/manga/mangadex/{id}` - Manga detail loads with chapters
- `/read/mangadex/{id}/{chapterId}` - Reader loads pages
- `/library` - Library shows saved manga
- `/history` - History shows reading progress
- `/settings` - Settings page renders

- [ ] **Step 3: Build for production**

```bash
npm run build
```

- [ ] **Step 4: Fix any build errors**

Address TypeScript or build errors as needed.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final polish and testing"
```

---

## Summary

This plan implements the core Mihon Web features:

1. **Source System**: Pluggable adapter pattern with MangaDex and MangaSee
2. **API Routes**: Backend proxy for source fetching, image proxy for CORS
3. **Reader**: Page mode (LTR/RTL) and webtoon mode (continuous scroll)
4. **Library**: Add/remove manga, category filtering
5. **History**: Track reading progress per chapter
6. **UI**: Dark theme, responsive design, loading states

**Total Tasks**: 24
**Estimated Time**: 4-6 hours for experienced developer

**Next Steps After MVP**:
- User authentication
- Tracker integration (MAL, AniList)
- Backup/restore
- More source adapters
- PWA support
