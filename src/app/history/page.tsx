"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { FallbackCover } from "@/components/manga/FallbackCover";
import { Modal } from "@/components/ui/Modal";

interface HistoryItem {
  id: string;
  mangaId: string;
  providerId: string;
  chapterId: string;
  chapterNumber: number | null;
  mangaTitle: string;
  coverUrl: string;
  readAt: string;
}

function groupByDate(items: HistoryItem[]): { label: string; items: HistoryItem[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, HistoryItem[]> = {
    "Today": [],
    "Yesterday": [],
    "This Week": [],
    "Older": [],
  };

  for (const item of items) {
    const d = new Date(item.readAt);
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemDate.getTime() >= today.getTime()) {
      groups["Today"].push(item);
    } else if (itemDate.getTime() >= yesterday.getTime()) {
      groups["Yesterday"].push(item);
    } else if (itemDate.getTime() >= weekAgo.getTime()) {
      groups["This Week"].push(item);
    } else {
      groups["Older"].push(item);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.get<HistoryItem[]>("/api/history")
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const deleteItem = async (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    try {
      await ApiClient.delete(`/api/history/${id}`);
    } catch {
      ApiClient.get<HistoryItem[]>("/api/history").then(setHistory).catch(() => {});
    }
  };

  const grouped = groupByDate(history);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reading History</h1>
        <p className="text-muted text-sm mt-1">
          {history.length} chapters read
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-bg-raised rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20">
          <svg className="h-16 w-16 mx-auto mb-4 text-primary/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <p className="text-lg font-semibold mb-2 text-zinc-300">No reading history</p>
          <p className="text-sm text-muted">Start reading to track your progress</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">{group.label}</h2>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/read/${item.providerId}/${item.mangaId}/${item.chapterId}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg-raised transition-all duration-150 group border border-transparent hover:border-border"
                  >
                    <div className="w-12 h-16 rounded-lg overflow-hidden bg-bg-overlay shrink-0">
                      <HistoryCover coverUrl={item.coverUrl} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary-light transition-colors">
                        {item.mangaTitle}
                      </p>
                      <p className="text-xs text-muted">
                        Chapter {item.chapterNumber ?? "?"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(item.readAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDelete(item.id);
                      }}
                      className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                      aria-label="Remove from history"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Remove from history"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmDelete) deleteItem(confirmDelete);
                setConfirmDelete(null);
              }}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-300">Are you sure you want to remove this from your reading history?</p>
      </Modal>
    </div>
  );
}

function HistoryCover({ coverUrl }: { coverUrl: string }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = coverUrl ? ApiClient.imageUrl(coverUrl) : null;

  if (!imageUrl || imgError) {
    return <FallbackCover size="sm" />;
  }

  return (
    <img
      src={imageUrl}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}
