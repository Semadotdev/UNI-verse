"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useLibrary } from "@/contexts/LibraryContext";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGridSkeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
import { LibraryFilters, SortOption, ViewMode } from "@/components/library/LibraryFilters";
import { CategoryManager } from "@/components/library/CategoryManager";

interface HistoryItem {
  mangaId: string;
  sourceId: string;
  chapterNum: number;
  progress: number;
  readAt: string;
}

export default function LibraryPage() {
  const { library, loading } = useLibrary();
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("recently_added");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Fetch reading history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    }
    loadHistory();
  }, []);

  // Extract all unique categories from library
  useEffect(() => {
    const cats = [
      ...new Set(
        library.flatMap((item) =>
          item.categories ? item.categories.split(",").filter(Boolean) : []
        )
      ),
    ];
    setAllCategories(cats.sort());
  }, [library]);

  // Build a map of mangaId -> latest history entry
  const historyMap = useMemo(() => {
    const map = new Map<string, HistoryItem>();
    for (const entry of history) {
      const existing = map.get(entry.mangaId);
      if (!existing || new Date(entry.readAt) > new Date(existing.readAt)) {
        map.set(entry.mangaId, entry);
      }
    }
    return map;
  }, [history]);

  // Filter library items
  const filteredLibrary = useMemo(() => {
    let items = filter
      ? library.filter((item) => {
          const cats = item.categories ? item.categories.split(",") : [];
          return cats.includes(filter);
        })
      : library;

    // Sort items
    items = [...items].sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);
        case "last_read": {
          const aHistory = historyMap.get(a.mangaId);
          const bHistory = historyMap.get(b.mangaId);
          const aDate = aHistory ? new Date(aHistory.readAt).getTime() : 0;
          const bDate = bHistory ? new Date(bHistory.readAt).getTime() : 0;
          return bDate - aDate;
        }
        case "recently_added":
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

    return items;
  }, [library, filter, sort, historyMap]);

  // Handle category updates from modal
  const handleCategoriesUpdate = (updatedCategories: string[]) => {
    // For now, just update local state
    // In a real app, this would persist to the backend
    setAllCategories(updatedCategories);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
        <MangaGridSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCategoryManager(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Manage Categories
        </Button>
      </div>

      {/* Category filter pills */}
      {allCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === null ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {allCategories.map((cat) => (
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

      {/* Sort and View Toggle */}
      <LibraryFilters
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Library content */}
      {filteredLibrary.length > 0 ? (
        viewMode === "grid" ? (
          <MangaGrid
            manga={filteredLibrary.map((item) => ({
              id: item.mangaId,
              title: item.title,
              cover: item.cover || "",
              status: (item.status as "ongoing" | "completed" | "hiatus" | "cancelled") || undefined,
            }))}
            sourceId={filteredLibrary[0]?.sourceId || "mangadex"}
          />
        ) : (
          /* List view */
          <div className="space-y-3">
            {filteredLibrary.map((item) => {
              const historyEntry = historyMap.get(item.mangaId);
              return (
                <Link
                  key={`${item.sourceId}-${item.mangaId}`}
                  href={`/manga/${item.sourceId}/${item.mangaId}`}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-700 hover:shadow-lg"
                >
                  {/* Cover thumbnail */}
                  <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                    {item.cover ? (
                      <img
                        src={`/api/image?url=${encodeURIComponent(item.cover)}`}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-100 truncate">
                      {item.title}
                    </h3>
                    {item.status && (
                      <p className="text-xs text-zinc-500 capitalize mt-0.5">
                        {item.status}
                      </p>
                    )}
                    {item.categories && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.categories
                          .split(",")
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((cat) => (
                            <span
                              key={cat}
                              className="inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                            >
                              {cat}
                            </span>
                          ))}
                        {item.categories.split(",").filter(Boolean).length > 3 && (
                          <span className="text-[10px] text-zinc-500">
                            +{item.categories.split(",").filter(Boolean).length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Reading progress bar */}
                    {historyEntry && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                          <span>Ch. {historyEntry.chapterNum}</span>
                          <span>{historyEntry.progress}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${historyEntry.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Last read timestamp */}
                  {historyEntry && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] text-zinc-500">Last read</p>
                      <p className="text-xs text-zinc-400">
                        {formatRelativeTime(historyEntry.readAt)}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )
      ) : (
        /* Empty state */
        <EmptyState
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-zinc-600"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          }
          title={filter ? "No manga in this category" : "Your library is empty"}
          description={
            filter
              ? "Try selecting a different category or browse for manga to add."
              : "Search and add manga to your library to start reading!"
          }
          actionLabel={filter ? "View all manga" : undefined}
          onAction={filter ? () => setFilter(null) : undefined}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={allCategories}
          onUpdate={handleCategoriesUpdate}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
