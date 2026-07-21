"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import {
  getFavouriteWebsites,
  addFavouriteWebsite,
  removeFavouriteWebsite,
  MangaWebsite,
} from "@/lib/sources/websites";
import {
  Globe,
  Heart,
  ExternalLink,
  Search,
  Star,
  Filter,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  aggregator: "Aggregators",
  scanlation: "Scanlation",
  raw: "Raw/Non-English",
};

export default function WebsitesPage() {
  const { addToast } = useToast();
  const [websites, setWebsites] = useState<MangaWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFavourites(getFavouriteWebsites());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/websites");
        if (res.ok) {
          const data = await res.json();
          setWebsites(data);
        }
      } catch {
        addToast("Failed to load websites", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  const toggleFavourite = (id: string) => {
    if (favourites.includes(id)) {
      removeFavouriteWebsite(id);
      setFavourites((prev) => prev.filter((f) => f !== id));
      addToast("Removed from favourites", "success");
    } else {
      addFavouriteWebsite(id);
      setFavourites((prev) => [...prev, id]);
      addToast("Added to favourites", "success");
    }
  };

  const filtered = websites.filter((w) => {
    if (filter === "favourites") return favourites.includes(w.id);
    if (filter !== "all") return w.category === filter;
    return true;
  }).filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
  });

  const categories = ["all", "favourites", "aggregator", "scanlation", "raw"];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-zinc-800" />
        <MangaGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Websites</h1>
        <p className="mt-1 text-zinc-400">
          Browse manga websites and save your favourites
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search websites..."
          className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat === "all" && <Filter className="mr-1.5 h-3.5 w-3.5" />}
            {cat === "favourites" && <Star className="mr-1.5 h-3.5 w-3.5" />}
            {cat === "favourites" ? "Favourites" : cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
          </Button>
        ))}
      </div>

      {/* Website cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((site) => {
            const isFav = favourites.includes(site.id);
            return (
              <Card
                key={site.id}
                className="group relative overflow-hidden transition-all hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                    {site.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-zinc-100">
                      {site.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-zinc-400 line-clamp-2">
                      {site.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 capitalize">
                        {site.category}
                      </span>
                      <span>{site.lang.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavourite(site.id)}
                    className={isFav ? "text-yellow-400 hover:text-yellow-300" : "text-zinc-500 hover:text-zinc-300"}
                  >
                    <Heart
                      className={`mr-1.5 h-4 w-4 ${isFav ? "fill-yellow-400" : ""}`}
                    />
                    {isFav ? "Favourited" : "Favourite"}
                  </Button>

                  <a
                    href={site.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Visit
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title={filter === "favourites" ? "No favourited websites" : "No websites found"}
          description={
            filter === "favourites"
              ? "Favourite websites to see them here"
              : "Try adjusting your search or filters"
          }
        />
      )}
    </div>
  );
}
