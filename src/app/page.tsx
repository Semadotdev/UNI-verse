"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import type { Manga } from "@/domain/entities/manga";
import { MangaCard } from "@/components/manga/MangaCard";
import { FallbackCover } from "@/components/manga/FallbackCover";
import { useProvider } from "@/contexts/ProviderContext";

export default function HomePage() {
  const [popular, setPopular] = useState<Manga[]>([]);
  const [latest, setLatest] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroCoverErrors, setHeroCoverErrors] = useState<Set<number>>(new Set());
  const { selectedProvider } = useProvider();
  const trendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [popRes, latestRes] = await Promise.all([
          fetch(`/api/manga/popular?providerId=${selectedProvider}`),
          fetch(`/api/manga/latest?providerId=${selectedProvider}`),
        ]);
        if (popRes.ok) {
          const d = await popRes.json();
          setPopular(d.data || []);
        }
        if (latestRes.ok) {
          const d = await latestRes.json();
          setLatest(d.data || []);
        }
      } catch (e) {
        console.error("Failed to load home page data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedProvider]);

  useEffect(() => {
    if (popular.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(popular.length, 5));
    }, 6000);
    return () => clearInterval(interval);
  }, [popular]);

  const heroManga = popular[heroIndex];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {loading ? (
        <div className="relative h-[420px] md:h-[480px] bg-bg-raised animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-48 bg-border rounded animate-pulse" />
          </div>
        </div>
      ) : heroManga ? (
        <div className="relative h-[420px] md:h-[480px] overflow-hidden">
          {/* Blurred background cover */}
          <div className="absolute inset-0">
            {heroManga.cover && (
              <img
                src={ApiClient.imageUrl(heroManga.cover)}
                alt=""
                className="w-full h-full object-cover blur-xl scale-125 opacity-20"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-transparent" />
            {/* Purple ambient glow */}
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>

          {/* Hero content */}
          <div className="relative h-full container mx-auto px-4 md:px-8 flex items-center justify-center md:items-end md:justify-start pb-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 max-w-3xl text-center md:text-left animate-fade-in-up">
              {/* Cover */}
              <Link
                href={`/manga/${heroManga.providerId}/${heroManga.id}`}
                className="shrink-0 w-24 md:w-44 lg:w-52 aspect-[3/4] rounded-xl overflow-hidden shadow-glow-lg border border-primary/20"
              >
                {heroManga.cover && !heroCoverErrors.has(heroIndex) ? (
                  <img
                    src={ApiClient.imageUrl(heroManga.cover)}
                    alt={heroManga.title}
                    className="w-full h-full object-cover"
                    onError={() => setHeroCoverErrors((prev) => new Set(prev).add(heroIndex))}
                  />
                ) : (
                  <FallbackCover size="lg" />
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3 line-clamp-2">
                  {heroManga.title}
                </h1>
                {heroManga.description && (
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 mb-4 max-w-lg">
                    {heroManga.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
                  {heroManga.genres.slice(0, 4).map((genre) => (
                    <span key={genre} className="px-3 py-1 text-xs rounded-full bg-primary/15 text-primary-light border border-primary/25 font-medium">
                      {genre}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/manga/${heroManga.providerId}/${heroManga.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Read Now
                </Link>
              </div>
            </div>
          </div>

          {/* Hero dot indicators */}
          {popular.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {popular.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === heroIndex
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-10 space-y-12 flex-1">

        {/* Trending — horizontal scroll */}
        {loading ? (
          <section>
            <div className="h-7 w-32 bg-border rounded animate-pulse mb-6" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-36 shrink-0 aspect-[3/4] bg-bg-raised rounded-xl animate-pulse" />
              ))}
            </div>
          </section>
        ) : popular.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Trending</h2>
              <Link href="/search" className="text-sm text-primary-light hover:text-primary transition-colors font-medium">
                View All →
              </Link>
            </div>
            <div
              ref={trendingRef}
              className="flex gap-4 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory"
            >
              {popular.slice(0, 12).map((m, i) => (
                <div
                  key={`${m.providerId}-${m.id}`}
                  className="w-36 lg:w-40 shrink-0 snap-start animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <MangaCard manga={m} showChapterBadge />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Latest Updates — card list */}
        {loading ? (
          <section>
            <div className="h-7 w-40 bg-border rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-bg-raised rounded-xl animate-pulse" />
              ))}
            </div>
          </section>
        ) : latest.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Latest Updates</h2>
              <Link href="/search" className="text-sm text-primary-light hover:text-primary transition-colors font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latest.slice(0, 12).map((m, i) => (
                <Link
                  key={`${m.providerId}-${m.id}`}
                  href={`/manga/${m.providerId}/${m.id}`}
                  className="group flex gap-3 p-3 rounded-xl bg-bg-raised border border-border hover:border-primary/30 hover:shadow-card transition-all duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-16 h-22 shrink-0 rounded-lg overflow-hidden bg-bg-overlay">
                    <LatestCover manga={m} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary-light transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted mt-1">
                      {m.status === "ongoing" ? "Ongoing" : m.status === "completed" ? "Completed" : ""}
                    </p>
                    {m.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.genres.slice(0, 2).map((genre) => (
                          <span key={genre} className="px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary-light border border-primary/20">
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Empty state */}
        {!loading && popular.length === 0 && latest.length === 0 && (
          <div className="text-center py-24">
            <svg className="h-20 w-20 mx-auto mb-6 text-primary/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <p className="text-lg font-semibold mb-2 text-zinc-300">No manga available</p>
            <p className="text-sm text-muted">Try selecting a different source above</p>
          </div>
        )}
      </div>

    </div>
  );
}

function LatestCover({ manga }: { manga: Manga }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = manga.cover ? ApiClient.imageUrl(manga.cover) : null;

  if (!imageUrl || imgError) {
    return <FallbackCover size="sm" />;
  }

  return (
    <img
      src={imageUrl}
      alt={manga.title}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}
