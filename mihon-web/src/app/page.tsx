"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export default function HomePage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sourcesRes, popularRes, latestRes] = await Promise.all([
          fetch("/api/sources"),
          fetch("/api/search?q=one+piece&page=1"),
          fetch("/api/search?q=naruto&page=1"),
        ]);

        if (sourcesRes.ok) {
          const sourcesData = await sourcesRes.json();
          if (Array.isArray(sourcesData)) {
            setSources(sourcesData.filter((s: Source) => s.enabled));
          }
        }

        if (popularRes.ok) {
          const popularData = await popularRes.json();
          if (Array.isArray(popularData) && popularData.length > 0) {
            setPopular(popularData[0]?.items || []);
          }
        }

        if (latestRes.ok) {
          const latestData = await latestRes.json();
          if (Array.isArray(latestData) && latestData.length > 0) {
            setLatest(latestData[0]?.items || []);
          }
        }
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
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold">Mihon Web</h1>
        <p className="mb-6 text-zinc-400">A web-based manga reader</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Search className="h-5 w-5" />
          Search Manga
        </Link>
      </div>

      {/* Continue Reading - placeholder */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-6 w-6 text-primary" />
            Continue Reading
          </h2>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-zinc-500">
            Your reading history will appear here. Start reading to pick up where
            you left off.
          </p>
        </div>
      </section>

      {/* Browse by Source */}
      {sources.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Browse by Source</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <Link
                key={source.id}
                href={`/source/${source.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-zinc-800 p-6",
                  "bg-gradient-to-br from-primary/20 to-accent/20",
                  "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:border-zinc-700"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white">
                      {source.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                      {source.description}
                    </p>
                  </div>
                  <ChevronRight className="ml-3 h-5 w-5 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/30">
                    Browse
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Popular</h2>
            <Link
              href="/search"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <MangaGrid manga={popular} sourceId="mangadex" />
        </section>
      )}

      {/* Latest Updates */}
      {latest.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Updates</h2>
            <Link
              href="/search"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <MangaGrid manga={latest} sourceId="mangadex" />
        </section>
      )}

      {/* Empty state */}
      {popular.length === 0 && latest.length === 0 && (
        <div className="mt-8 text-center text-zinc-500">
          <p className="mb-2 text-lg">Start exploring manga</p>
          <p className="text-sm">Use the search to find your favorite series</p>
        </div>
      )}
    </div>
  );
}
