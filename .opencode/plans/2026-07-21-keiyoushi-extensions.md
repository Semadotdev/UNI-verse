# Keiyoushi Extensions Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Keiyoushi extensions index (1,367 extensions) as a browsable catalog with the ability to "install" extensions as generic web-scrapable sources.

**Architecture:** A server-side proxy fetches and caches the Keiyoushi JSON index. A new `/extensions` page displays the catalog with search/filter. When a user installs an extension, a `GenericScraperSource` adapter is created using the extension's `baseUrl` and common HTML scraping heuristics. Installed extensions persist in `localStorage` and are dynamically registered in the source registry at runtime.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, fetch + in-memory cache, regex HTML parsing (same pattern as MangaSee adapter)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/sources/keiyoushi.ts` | Fetch/cache Keiyoushi index, search/filter, install/uninstall logic |
| `src/lib/sources/generic-scraper.ts` | Generic web scraper adapter that works with any `baseUrl` |
| `src/app/api/keiyoushi/route.ts` | GET endpoint returning the extensions index |
| `src/app/api/sources/installed/route.ts` | GET/POST endpoint for managing installed extensions |
| `src/app/extensions/page.tsx` | Browsable catalog page with search, language filter, NSFW toggle |
| `src/components/extensions/ExtensionCard.tsx` | Card component for a single extension |
| `src/components/extensions/ExtensionFilters.tsx` | Filter bar (search, language dropdown, NSFW toggle) |
| `src/app/settings/page.tsx` | Modify: add "Installed Extensions" section |
| `src/lib/sources/registry.ts` | Modify: add `registerDynamicSource()` for runtime registration |

---

### Task 1: Keiyoushi Catalog Service

**Files:**
- Create: `src/lib/sources/keiyoushi.ts`

- [ ] **Step 1: Create the Keiyoushi service**

```ts
// src/lib/sources/keiyoushi.ts
const INDEX_URL = "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json";

export interface KeiyoushiExtension {
  name: string;
  pkg: string;
  apk: string;
  lang: string;
  code: number;
  version: string;
  nsfw: number;
  sources: Array<{
    name: string;
    lang: string;
    id: string;
    baseUrl: string;
  }>;
}

let cache: KeiyoushiExtension[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchExtensions(): Promise<KeiyoushiExtension[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  const res = await fetch(INDEX_URL, {
    headers: { "User-Agent": "MihonWeb/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Keiyoushi index: ${res.status}`);
  }

  cache = await res.json();
  cacheTime = Date.now();
  return cache!;
}

export function searchExtensions(
  extensions: KeiyoushiExtension[],
  query: string,
  lang?: string,
  nsfw?: boolean
): KeiyoushiExtension[] {
  let results = extensions;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.sources.some((s) => s.name.toLowerCase().includes(q))
    );
  }

  if (lang) {
    results = results.filter((ext) => ext.lang === lang);
  }

  if (!nsfw) {
    results = results.filter((ext) => ext.nsfw === 0);
  }

  return results;
}

export function getLanguages(extensions: KeiyoushiExtension[]): string[] {
  const langs = new Set(extensions.map((e) => e.lang));
  return Array.from(langs).sort();
}

const INSTALLED_KEY = "mihon-installed-extensions";

export function getInstalledExtensions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(INSTALLED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function installExtension(pkg: string): void {
  const installed = getInstalledExtensions();
  if (!installed.includes(pkg)) {
    installed.push(pkg);
    localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed));
  }
}

export function uninstallExtension(pkg: string): void {
  const installed = getInstalledExtensions().filter((p) => p !== pkg);
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed));
}

export function isExtensionInstalled(pkg: string): boolean {
  return getInstalledExtensions().includes(pkg);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/lib/sources/keiyoushi.ts && git commit -m "feat: add Keiyoushi catalog service with fetch, search, and install tracking"
```

---

### Task 2: Generic Web Scraper Adapter

**Files:**
- Create: `src/lib/sources/generic-scraper.ts`

- [ ] **Step 1: Create the generic scraper**

This adapter scrapes manga sites using configurable CSS selectors with sensible defaults. It handles the common patterns found across manga websites.

```ts
// src/lib/sources/generic-scraper.ts
import { SourceAdapter, SearchResult, MangaDetails, Chapter } from "./types";

export interface ScraperConfig {
  // URL patterns
  searchUrl: (query: string, page: number) => string;
  popularUrl: (page: number) => string;
  latestUrl: (page: number) => string;
  mangaUrl: (mangaId: string) => string;
  chapterUrl: (chapterId: string) => string;

  // Regex patterns for HTML parsing
  searchResults: RegExp;
  popularResults: RegExp;
  latestResults: RegExp;
  mangaTitle: RegExp;
  mangaCover: RegExp;
  mangaDescription: RegExp;
  mangaStatus: RegExp;
  chapterList: RegExp;
  pageImages: RegExp;
}

const DEFAULT_CONFIG: ScraperConfig = {
  searchUrl: (query, page) => `/?s=${encodeURIComponent(query)}&page=${page}`,
  popularUrl: (page) => `/`,
  latestUrl: (page) => `/`,
  mangaUrl: (mangaId) => `/${mangaId}`,
  chapterUrl: (chapterId) => `/${chapterId}`,

  // Match common manga card patterns: <a href="..."><img src="..."><span>Title</span></a>
  searchResults: /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<(?:span|h[23]|div)[^>]*>([^<]+)<\/(?:span|h[23]|div)>/gi,
  popularResults: /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<(?:span|h[23]|div)[^>]*>([^<]+)<\/(?:span|h[23]|div)>/gi,
  latestResults: /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<(?:span|h[23]|div)[^>]*>([^<]+)<\/(?:span|h[23]|div)>/gi,
  mangaTitle: /<h1[^>]*>([^<]+)<\/h1>/i,
  mangaCover: /<img[^>]*(?:class="[^"]*(?:cover|poster|thumb|image)[^"]*")[^>]*src="([^"]*)"/i,
  mangaDescription: /<(?:p|div)[^>]*class="[^"]*(?:summary|description|synopsis)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i,
  mangaStatus: /<(?:span|div)[^>]*class="[^"]*status[^"]*"[^>]*>([^<]+)<\/(?:span|div)>/i,
  chapterList: /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?Chapter\s*([\d.]+)/gi,
  pageImages: /<img[^>]*class="[^"]*(?:page|reader)[^"]*"[^>]*src="([^"]*)"/gi,
};

export class GenericScraperSource implements SourceAdapter {
  id: string;
  name: string;
  icon = "🌐";
  description: string;
  enabled = true;
  private baseUrl: string;
  private config: ScraperConfig;

  constructor(
    id: string,
    name: string,
    baseUrl: string,
    description: string,
    config?: Partial<ScraperConfig>
  ) {
    this.id = id;
    this.name = name;
    this.baseUrl = baseUrl;
    this.description = description;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async fetchPage(path: string): Promise<string> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: this.baseUrl,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  private parseResults(html: string, regex: RegExp): SearchResult[] {
    const results: SearchResult[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = regex.exec(html)) !== null) {
      const href = match[1];
      const cover = match[2];
      const title = match[3].trim();

      // Extract manga ID from URL
      const id = href.split("/").filter(Boolean).pop() || href;
      if (seen.has(id)) continue;
      seen.add(id);

      // Make URLs absolute
      const fullCover = cover.startsWith("http") ? cover : `${this.baseUrl}${cover}`;
      const fullHref = href.startsWith("http") ? href : `${this.baseUrl}${href}`;

      results.push({
        id,
        title,
        cover: fullCover,
      });

      if (results.length >= 20) break;
    }

    return results;
  }

  async search(query: string, page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.searchUrl(query, page));
    return this.parseResults(html, new RegExp(this.config.searchResults.source, this.config.searchResults.flags));
  }

  async popular(page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.popularUrl(page));
    return this.parseResults(html, new RegExp(this.config.popularResults.source, this.config.popularResults.flags));
  }

  async latest(page: number): Promise<SearchResult[]> {
    const html = await this.fetchPage(this.config.latestUrl(page));
    return this.parseResults(html, new RegExp(this.config.latestResults.source, this.config.latestResults.flags));
  }

  async byGenre(genre: string, page: number): Promise<SearchResult[]> {
    return this.search(genre, page);
  }

  async getManga(mangaId: string): Promise<MangaDetails> {
    const html = await this.fetchPage(this.config.mangaUrl(mangaId));

    const titleMatch = html.match(this.config.mangaTitle);
    const coverMatch = html.match(this.config.mangaCover);
    const descMatch = html.match(this.config.mangaDescription);
    const statusMatch = html.match(this.config.mangaStatus);

    const chapters = this.parseChapters(html);

    return {
      id: mangaId,
      title: titleMatch?.[1]?.trim() || "Unknown",
      cover: coverMatch?.[1] ? (coverMatch[1].startsWith("http") ? coverMatch[1] : `${this.baseUrl}${coverMatch[1]}`) : "",
      description: descMatch?.[1]?.replace(/<[^>]*>/g, "").trim(),
      chapters,
    };
  }

  async getChapters(mangaId: string): Promise<Chapter[]> {
    const html = await this.fetchPage(this.config.mangaUrl(mangaId));
    return this.parseChapters(html);
  }

  private parseChapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];
    const regex = new RegExp(this.config.chapterList.source, this.config.chapterList.flags);
    const seen = new Set<string>();
    let match;

    while ((match = regex.exec(html)) !== null) {
      const href = match[1];
      const numStr = match[2];
      const id = href.split("/").filter(Boolean).pop() || href;

      if (seen.has(id)) continue;
      seen.add(id);

      chapters.push({
        id,
        number: parseFloat(numStr) || 0,
        title: `Chapter ${numStr}`,
      });
    }

    return chapters.reverse();
  }

  async getPages(chapterId: string): Promise<string[]> {
    const html = await this.fetchPage(this.config.chapterUrl(chapterId));
    const pages: string[] = [];
    const regex = new RegExp(this.config.pageImages.source, this.config.pageImages.flags);
    let match;

    while ((match = regex.exec(html)) !== null) {
      const src = match[1];
      pages.push(src.startsWith("http") ? src : `${this.baseUrl}${src}`);
    }

    return pages;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/lib/sources/generic-scraper.ts && git commit -m "feat: add GenericScraperSource adapter for Keiyoushi extensions"
```

---

### Task 3: Keiyoushi API Route

**Files:**
- Create: `src/app/api/keiyoushi/route.ts`

- [ ] **Step 1: Create the API route**

```ts
// src/app/api/keiyoushi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchExtensions, searchExtensions } from "@/lib/sources/keiyoushi";

export async function GET(request: NextRequest) {
  try {
    const extensions = await fetchExtensions();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const lang = searchParams.get("lang") || undefined;
    const nsfw = searchParams.get("nsfw") === "true";

    const filtered = searchExtensions(extensions, query, lang, nsfw);

    return NextResponse.json({
      total: extensions.length,
      filtered: filtered.length,
      extensions: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch extensions index" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/app/api/keiyoushi/route.ts && git commit -m "feat: add Keiyoushi extensions API route"
```

---

### Task 4: Installed Extensions API Route

**Files:**
- Create: `src/app/api/sources/installed/route.ts`

- [ ] **Step 1: Create the API route**

This route manages installed extensions by reading/writing a JSON file on disk (since localStorage is client-only, we need a server-side counterpart for the registry).

```ts
// src/app/api/sources/installed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchExtensions } from "@/lib/sources/keiyoushi";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "installed-extensions.json");

interface InstalledConfig {
  packages: string[];
}

function loadConfig(): InstalledConfig {
  if (existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
      return { packages: [] };
    }
  }
  return { packages: [] };
}

function saveConfig(config: InstalledConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  const config = loadConfig();

  // Enrich with full extension data
  try {
    const allExtensions = await fetchExtensions();
    const installed = allExtensions.filter((ext) =>
      config.packages.includes(ext.pkg)
    );
    return NextResponse.json(installed);
  } catch {
    return NextResponse.json(config.packages);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pkg, action } = body;

  if (!pkg || !action) {
    return NextResponse.json({ error: "pkg and action required" }, { status: 400 });
  }

  const config = loadConfig();

  if (action === "install") {
    if (!config.packages.includes(pkg)) {
      config.packages.push(pkg);
    }
  } else if (action === "uninstall") {
    config.packages = config.packages.filter((p) => p !== pkg);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  saveConfig(config);
  return NextResponse.json({ success: true, packages: config.packages });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/app/api/sources/installed/route.ts && git commit -m "feat: add installed extensions API with disk persistence"
```

---

### Task 5: Update Source Registry for Dynamic Sources

**Files:**
- Modify: `src/lib/sources/registry.ts`

- [ ] **Step 1: Add dynamic source registration**

Add functions to register/unregister sources at runtime from installed Keiyoushi extensions.

```ts
// Add these functions to src/lib/sources/registry.ts (after existing code)

import { GenericScraperSource } from "./generic-scraper";
import { KeiyoushiExtension } from "./keiyoushi";

export function registerDynamicSources(extensions: KeiyoushiExtension[]): void {
  for (const ext of extensions) {
    for (const source of ext.sources) {
      const id = `keiyoushi-${source.id}`;
      if (!sources.has(id)) {
        const scraper = new GenericScraperSource(
          id,
          source.name,
          source.baseUrl,
          `${ext.name} - ${source.name} (${ext.lang})`
        );
        sources.set(id, scraper);
      }
    }
  }
}

export function unregisterDynamicSources(): void {
  const dynamicIds = Array.from(sources.keys()).filter((id) =>
    id.startsWith("keiyoushi-")
  );
  for (const id of dynamicIds) {
    sources.delete(id);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/lib/sources/registry.ts && git commit -m "feat: add dynamic source registration for Keiyoushi extensions"
```

---

### Task 6: ExtensionCard Component

**Files:**
- Create: `src/components/extensions/ExtensionCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KeiyoushiExtension } from "@/lib/sources/keiyoushi";
import { Download, Trash2, Globe, Languages } from "lucide-react";

interface ExtensionCardProps {
  extension: KeiyoushiExtension;
  installed: boolean;
  onInstall: (pkg: string) => void;
  onUninstall: (pkg: string) => void;
}

const LANG_NAMES: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ar: "Arabic",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  tr: "Turkish",
  "pt-BR": "Brazilian Portuguese",
  "zh-Hans": "Simplified Chinese",
  all: "Multi-language",
};

export function ExtensionCard({
  extension,
  installed,
  onInstall,
  onUninstall,
}: ExtensionCardProps) {
  const langName = LANG_NAMES[extension.lang] || extension.lang;
  const sourceCount = extension.sources.length;

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30">
      {extension.nsfw === 1 && (
        <div className="absolute right-2 top-2 rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
          NSFW
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-100 truncate">
            {extension.name.replace("Tachiyomi: ", "")}
          </h3>

          <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" />
              {langName}
            </span>
            <span>v{extension.version}</span>
            {sourceCount > 1 && (
              <span className="text-zinc-500">{sourceCount} sources</span>
            )}
          </div>

          {extension.sources.length > 0 && (
            <p className="mt-1 text-xs text-zinc-500 truncate">
              {extension.sources[0].baseUrl}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {installed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUninstall(extension.pkg)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onInstall(extension.pkg)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Install
          </Button>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/components/extensions/ExtensionCard.tsx && git commit -m "feat: add ExtensionCard component"
```

---

### Task 7: ExtensionFilters Component

**Files:**
- Create: `src/components/extensions/ExtensionFilters.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Eye, EyeOff } from "lucide-react";

interface ExtensionFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: string[];
  showNsfw: boolean;
  onNsfwToggle: () => void;
  total: number;
  filtered: number;
}

const LANG_LABELS: Record<string, string> = {
  "": "All Languages",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ar: "Arabic",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  tr: "Turkish",
  "pt-BR": "Brazilian Portuguese",
  "zh-Hans": "Simplified Chinese",
  all: "Multi-language",
};

export function ExtensionFilters({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  languages,
  showNsfw,
  onNsfwToggle,
  total,
  filtered,
}: ExtensionFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search extensions..."
            className="pl-10"
          />
        </div>

        {/* Language filter */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {["", ...languages].map((lang) => (
            <option key={lang} value={lang}>
              {LANG_LABELS[lang] || lang}
            </option>
          ))}
        </select>

        {/* NSFW toggle */}
        <Button
          variant={showNsfw ? "primary" : "ghost"}
          size="sm"
          onClick={onNsfwToggle}
          className="shrink-0"
        >
          {showNsfw ? (
            <Eye className="mr-1.5 h-4 w-4" />
          ) : (
            <EyeOff className="mr-1.5 h-4 w-4" />
          )}
          NSFW
        </Button>
      </div>

      <p className="text-sm text-zinc-500">
        {filtered} of {total} extensions
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/components/extensions/ExtensionFilters.tsx && git commit -m "feat: add ExtensionFilters component"
```

---

### Task 8: Extensions Browse Page

**Files:**
- Create: `src/app/extensions/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { ExtensionCard } from "@/components/extensions/ExtensionCard";
import { ExtensionFilters } from "@/components/extensions/ExtensionFilters";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/contexts/ToastContext";
import { KeiyoushiExtension, getLanguages } from "@/lib/sources/keiyoushi";
import { Puzzle } from "lucide-react";

interface ApiData {
  total: number;
  filtered: number;
  extensions: KeiyoushiExtension[];
}

export default function ExtensionsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [showNsfw, setShowNsfw] = useState(false);
  const [installedPkgs, setInstalledPkgs] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (language) params.set("lang", language);
      if (showNsfw) params.set("nsfw", "true");

      const res = await fetch(`/api/keiyoushi?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);

        // Extract languages from full list on first load
        if (languages.length === 0) {
          setLanguages(getLanguages(result.extensions));
        }
      }
    } catch (error) {
      addToast("Failed to load extensions", "error");
    } finally {
      setLoading(false);
    }
  }, [query, language, showNsfw, languages.length, addToast]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  // Load installed from server
  useEffect(() => {
    fetch("/api/sources/installed")
      .then((r) => r.json())
      .then((exts) => {
        if (Array.isArray(exts)) {
          setInstalledPkgs(exts.map((e: KeiyoushiExtension) => e.pkg));
        }
      })
      .catch(() => {});
  }, []);

  const handleInstall = async (pkg: string) => {
    try {
      await fetch("/api/sources/installed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg, action: "install" }),
      });
      setInstalledPkgs((prev) => [...prev, pkg]);
      addToast("Extension installed", "success");
    } catch {
      addToast("Failed to install extension", "error");
    }
  };

  const handleUninstall = async (pkg: string) => {
    try {
      await fetch("/api/sources/installed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg, action: "uninstall" }),
      });
      setInstalledPkgs((prev) => prev.filter((p) => p !== pkg));
      addToast("Extension removed", "success");
    } catch {
      addToast("Failed to remove extension", "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Extensions</h1>
        <p className="mt-1 text-zinc-400">
          Browse and install manga sources from the Keiyoushi repository
        </p>
      </div>

      <ExtensionFilters
        query={query}
        onQueryChange={setQuery}
        language={language}
        onLanguageChange={setLanguage}
        languages={languages}
        showNsfw={showNsfw}
        onNsfwToggle={() => setShowNsfw(!showNsfw)}
        total={data?.total || 0}
        filtered={data?.filtered || 0}
      />

      {loading ? (
        <MangaGridSkeleton count={12} />
      ) : data && data.extensions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.extensions.map((ext) => (
            <ExtensionCard
              key={ext.pkg}
              extension={ext}
              installed={installedPkgs.includes(ext.pkg)}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Puzzle className="h-8 w-8" />}
          title="No extensions found"
          description="Try adjusting your search or filters"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/app/extensions/page.tsx && git commit -m "feat: add Extensions browse page with search and filters"
```

---

### Task 9: Add Extensions Link to Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Add Extensions nav item**

Read the current Navbar, then add an "Extensions" link with a `Puzzle` icon pointing to `/extensions`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/components/layout/Navbar.tsx && git commit -m "feat: add Extensions link to navigation bar"
```

---

### Task 10: Settings Page - Installed Extensions Section

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Add Installed Extensions section**

Add a new section to the settings page that shows installed Keiyoushi extensions with uninstall buttons. This sits between the existing "Extensions" (built-in sources) section and the "About" section.

```tsx
// Add this section inside the settings page, after the existing Extensions card:

// In the component, add state and fetch for installed extensions:
const [installedExts, setInstalledExts] = useState<any[]>([]);

useEffect(() => {
  fetch("/api/sources/installed")
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data)) setInstalledExts(data);
    })
    .catch(() => {});
}, []);

// Add handler:
const handleUninstallExt = async (pkg: string) => {
  await fetch("/api/sources/installed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pkg, action: "uninstall" }),
  });
  setInstalledExts((prev) => prev.filter((e: any) => e.pkg !== pkg));
  addToast("Extension removed", "success");
};

// New Card to add:
<Card>
  <h2 className="mb-4 text-lg font-semibold">Installed Extensions</h2>
  {installedExts.length === 0 ? (
    <p className="text-sm text-zinc-400">
      No extensions installed. Browse the{" "}
      <Link href="/extensions" className="text-primary hover:underline">
        Extensions page
      </Link>{" "}
      to add sources.
    </p>
  ) : (
    <div className="space-y-2">
      {installedExts.map((ext: any) => (
        <div key={ext.pkg} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <div>
            <p className="font-medium">{ext.name?.replace("Tachiyomi: ", "")}</p>
            <p className="text-xs text-zinc-500">v{ext.version} · {ext.lang}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handleUninstallExt(ext.pkg)}>
            Remove
          </Button>
        </div>
      ))}
    </div>
  )}
</Card>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/app/settings/page.tsx && git commit -m "feat: add installed extensions section to settings page"
```

---

### Task 11: Dynamic Source Loading on App Start

**Files:**
- Modify: `src/app/api/sources/route.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/sources/[id]/browse/route.ts`

- [ ] **Step 1: Update sources API to include dynamic sources**

The `/api/sources` route needs to also return dynamically registered Keiyoushi sources. Add logic to read `installed-extensions.json` and register them before returning results.

```ts
// In src/app/api/sources/route.ts, before getAllSources():
import { fetchExtensions } from "@/lib/sources/keiyoushi";
import { registerDynamicSources, unregisterDynamicSources } from "@/lib/sources/registry";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "installed-extensions.json");

async function syncDynamicSources() {
  unregisterDynamicSources();
  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      if (config.packages?.length > 0) {
        const allExtensions = await fetchExtensions();
        const installed = allExtensions.filter((e) => config.packages.includes(e.pkg));
        registerDynamicSources(installed);
      }
    } catch {}
  }
}
```

Call `await syncDynamicSources()` at the start of the GET handler.

Apply the same pattern to the search and browse routes.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
cd /home/jiromanalo/Projects/UNI-verse && git add mihon-web/src/app/api/sources/route.ts mihon-web/src/app/api/search/route.ts mihon-web/src/app/api/sources/\[id\]/browse/route.ts && git commit -m "feat: sync installed Keiyoushi extensions into source registry on API calls"
```

---

### Task 12: Final Build Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: 0 errors

- [ ] **Step 2: Run production build**

Run: `npm run build` in `/home/jiromanalo/Projects/UNI-verse/mihon-web`
Expected: Build succeeds, all routes compile

- [ ] **Step 3: Commit any fixes**

If there are build errors, fix them and commit.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Keiyoushi catalog service (fetch, search, install tracking) | `keiyoushi.ts` |
| 2 | Generic web scraper adapter | `generic-scraper.ts` |
| 3 | Keiyoushi API route | `api/keiyoushi/route.ts` |
| 4 | Installed extensions API (disk persistence) | `api/sources/installed/route.ts` |
| 5 | Dynamic source registration in registry | `registry.ts` |
| 6 | ExtensionCard component | `ExtensionCard.tsx` |
| 7 | ExtensionFilters component | `ExtensionFilters.tsx` |
| 8 | Extensions browse page | `extensions/page.tsx` |
| 9 | Navbar link | `Navbar.tsx` |
| 10 | Settings page installed section | `settings/page.tsx` |
| 11 | Dynamic source loading on API calls | `sources/route.ts`, `search/route.ts`, `browse/route.ts` |
| 12 | Final build verification | - |

**12 tasks, ~15 files created/modified**
