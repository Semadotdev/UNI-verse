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
