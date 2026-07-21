"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import {
  Search,
  BookOpen,
  ChevronRight,
  Library,
  BookMarked,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/contexts/LibraryContext";

/* ── Types ────────────────────────────────────────────────────────── */

interface Source {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

interface HistoryEntry {
  id: string;
  mangaId: string;
  sourceId: string;
  chapterId: string;
  chapterNum: number | null;
  readAt: string;
  progress: number | null;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/** Map source id to a relevant emoji for the card icon */
function sourceEmoji(id: string): string {
  const map: Record<string, string> = {
    mangadex: "\uD83D\uDCD6",
    mangasee: "\uD83C\uDF1F",
    mangakakalot: "\uD83D\uDCDA",
    mangaplus: "\uD83D\uDD25",
  };
  return map[id.toLowerCase()] ?? "\uD83D\uDCD6";
}

/* ── Component ────────────────────────────────────────────────────── */

export default function HomePage() {
  const { library, loading: libraryLoading } = useLibrary();

  const [sources, setSources] = useState<Source[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Data fetching ──────────────────────────────────────────────── */

  useEffect(() => {
    async function load() {
      try {
        const [sourcesRes, popularRes, latestRes, historyRes] =
          await Promise.all([
            fetch("/api/sources"),
            fetch("/api/search?q=one+piece&page=1"),
            fetch("/api/search?q=naruto&page=1"),
            fetch("/api/history"),
          ]);

        if (sourcesRes.ok) {
          const data = await sourcesRes.json();
          if (Array.isArray(data))
            setSources(data.filter((s: Source) => s.enabled));
        }

        if (popularRes.ok) {
          const data = await popularRes.json();
          if (Array.isArray(data) && data.length > 0)
            setPopular(data[0]?.items || []);
        }

        if (latestRes.ok) {
          const data = await latestRes.json();
          if (Array.isArray(data) && data.length > 0)
            setLatest(data[0]?.items || []);
        }

        if (historyRes.ok) {
          const data = await historyRes.json();
          if (Array.isArray(data)) setHistory(data);
        }
      } catch (error) {
        console.error("Failed to load home page data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Derived data ───────────────────────────────────────────────── */

  /** Deduplicate history by mangaId, keeping only the most recent entry */
  const continueReading = useMemo(() => {
    const byManga = new Map<string, HistoryEntry>();
    for (const entry of history) {
      const existing = byManga.get(entry.mangaId);
      if (!existing || new Date(entry.readAt) > new Date(existing.readAt)) {
        byManga.set(entry.mangaId, entry);
      }
    }
    return Array.from(byManga.values())
      .sort(
        (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
      )
      .slice(0, 12);
  }, [history]);

  const totalChaptersRead = history.length;
  const libraryCount = library.length;

  /* ── Loading state ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="animate-fade-in-up text-sm text-zinc-500">
            Loading your library...
          </p>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="animate-fade-in-up relative mb-12 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/20">
        {/* Animated gradient overlay */}
        <div className="animate-gradient-shift pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 opacity-60" />

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 px-6 py-12 text-center sm:px-10 sm:py-16">
          <h1 className="gradient-text mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Mihon Web
          </h1>
          <p className="mb-8 text-lg text-zinc-400">
            Your personal manga library, everywhere.
          </p>

          {/* Animated search bar */}
          <div className="mx-auto mb-8 max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for manga..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="search-hero-input w-full rounded-xl border border-zinc-700 bg-zinc-800/80 py-3 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-500 backdrop-blur-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <Library className="h-4 w-4 text-primary" />
              <span>
                <span className="font-semibold text-zinc-200">
                  {libraryCount}
                </span>{" "}
                {libraryCount === 1 ? "manga" : "manga"} in library
              </span>
            </div>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 text-zinc-400">
              <BookMarked className="h-4 w-4 text-accent" />
              <span>
                <span className="font-semibold text-zinc-200">
                  {totalChaptersRead}
                </span>{" "}
                {totalChaptersRead === 1 ? "chapter" : "chapters"} read
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTINUE READING ═══════════════ */}
      {continueReading.length > 0 && (
        <section className="animate-fade-in-up delay-1 mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <BookOpen className="h-6 w-6 text-primary" />
              Continue Reading
            </h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="flex gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {continueReading.map((entry, idx) => (
                <Link
                  key={entry.id}
                  href={`/manga/${entry.sourceId}/${entry.mangaId}?chapter=${entry.chapterId}`}
                  className={cn(
                    "animate-fade-in-up group flex min-w-[280px] items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 backdrop-blur-sm",
                    "transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60 hover:shadow-lg hover:shadow-primary/5",
                    `delay-${Math.min(idx + 1, 8)}`
                  )}
                >
                  {/* Cover */}
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    <img
                      src={`/api/image?url=${encodeURIComponent(
                        `https://uploads.mangadex.org/covers/${entry.mangaId}/cover.jpg`
                      )}`}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
                      Manga {entry.mangaId.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {entry.chapterNum != null
                        ? `Chapter ${entry.chapterNum}`
                        : "Last read"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {timeAgo(entry.readAt)}
                    </p>

                    {/* Progress bar */}
                    {entry.progress != null && entry.progress > 0 && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="animate-progress-fill h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${Math.min(entry.progress, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Continue button */}
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors group-hover:bg-primary/25">
                      <BookOpen className="h-3 w-3" />
                      Read
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ BROWSE BY SOURCE ═══════════════ */}
      {sources.length > 0 && (
        <section className="animate-fade-in-up delay-2 mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-accent" />
              Browse by Source
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source, idx) => (
              <Link
                key={source.id}
                href={`/source/${source.id}`}
                className={cn(
                  "source-card animate-fade-in-up group relative rounded-xl border border-zinc-800 p-6",
                  "bg-gradient-to-br from-zinc-900 to-zinc-900/80",
                  "transition-all duration-300 hover:scale-[1.02] hover:border-zinc-700 hover:shadow-xl hover:shadow-primary/10",
                  `delay-${Math.min(idx + 1, 8)}`
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 text-2xl">
                      {sourceEmoji(source.id)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white">
                        {source.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                        {source.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="ml-3 h-5 w-5 shrink-0 text-zinc-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1 text-xs font-medium text-primary transition-colors group-hover:bg-primary/25">
                    <TrendingUp className="h-3 w-3" />
                    Browse
                  </span>
                  <span className="text-xs text-zinc-600">
                    {source.id === "mangadex"
                      ? "200k+ titles"
                      : "10k+ titles"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ POPULAR ═══════════════ */}
      {popular.length > 0 && (
        <section className="animate-fade-in-up delay-3 mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-6 w-6 text-orange-400" />
              Popular
            </h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <MangaGrid manga={popular} sourceId="mangadex" />
        </section>
      )}

      {/* ═══════════════ RECENT UPDATES ═══════════════ */}
      {latest.length > 0 && (
        <section className="animate-fade-in-up delay-4 mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Clock className="h-6 w-6 text-emerald-400" />
              Recent Updates
            </h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* "New" badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="badge-new inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Updated today
            </span>
          </div>

          <MangaGrid manga={latest} sourceId="mangadex" />
        </section>
      )}

      {/* ═══════════════ EMPTY STATE ═══════════════ */}
      {popular.length === 0 && latest.length === 0 && (
        <div className="animate-fade-in-up mt-8 text-center text-zinc-500">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
            <Search className="h-8 w-8 text-zinc-600" />
          </div>
          <p className="mb-2 text-lg font-medium text-zinc-400">
            Start exploring manga
          </p>
          <p className="text-sm text-zinc-600">
            Use the search above to find your favorite series
          </p>
        </div>
      )}
    </div>
  );
}
