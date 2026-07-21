"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Search } from "lucide-react";

export default function HomePage() {
  const [popular, setPopular] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const popularRes = await fetch("/api/search?q=one+piece&page=1");
        if (popularRes.ok) {
          const popularData = await popularRes.json();
          if (Array.isArray(popularData) && popularData.length > 0) {
            setPopular(popularData[0]?.items || []);
          }
        }

        const latestRes = await fetch("/api/search?q=naruto&page=1");
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
      <div className="mb-8 text-center">
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

      {popular.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Popular</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <MangaGrid manga={popular} sourceId="mangadex" />
        </section>
      )}

      {latest.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Updates</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <MangaGrid manga={latest} sourceId="mangadex" />
        </section>
      )}

      {popular.length === 0 && latest.length === 0 && (
        <div className="mt-8 text-center text-zinc-500">
          <p className="mb-2 text-lg">Start exploring manga</p>
          <p className="text-sm">Use the search to find your favorite series</p>
        </div>
      )}
    </div>
  );
}
