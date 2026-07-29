"use client";

import { useState } from "react";
import type { Manga } from "@/domain/entities/manga";
import { MangaCard } from "./MangaCard";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";

interface MangaGridProps {
  manga: Manga[];
  emptyMessage?: string;
  loading?: boolean;
  showChapterBadges?: boolean;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  onPageChange?: (page: number) => void;
}

function Pagination({
  page,
  totalPages,
  hasMore,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}) {
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  if (totalPages <= 1 && !hasMore) return null;

  if (totalPages === 0) {
    return (
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>
    );
  }

  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const handleJump = () => {
    const num = parseInt(jumpValue, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpOpen(false);
      setJumpValue("");
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <button
              key={`dots-${i}`}
              onClick={() => {
                setJumpValue("");
                setJumpOpen(true);
              }}
              className="px-2 py-2 text-sm text-muted hover:text-zinc-300 transition-colors"
            >
              …
            </button>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                p === page
                  ? "bg-primary border-primary text-white shadow-glow"
                  : "border-border bg-bg-raised text-zinc-400 hover:border-primary/50 hover:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore && page >= totalPages}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>

      <Modal
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        title="Jump to page"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setJumpOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleJump}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/80 transition-all"
            >
              Go
            </button>
          </>
        }
      >
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJump();
          }}
          placeholder={`1 – ${totalPages}`}
          autoFocus
          className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-bg-raised text-zinc-100 placeholder-zinc-500 outline-none focus:border-primary transition-colors"
        />
      </Modal>
    </>
  );
}

export function MangaGrid({
  manga,
  emptyMessage = "No manga found",
  loading = false,
  showChapterBadges = false,
  page,
  totalPages,
  hasMore,
  onPageChange,
}: MangaGridProps) {
  if (loading) {
    return <MangaGridSkeleton count={12} />;
  }

  if (manga.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="h-16 w-16 mx-auto mb-4 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <p className="text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
        {manga.map((m) => (
          <MangaCard
            key={`${m.providerId}-${m.id}`}
            manga={m}
            showChapterBadge={showChapterBadges}
          />
        ))}
      </div>
      {page !== undefined && totalPages !== undefined && hasMore !== undefined && onPageChange && (
        <Pagination page={page} totalPages={totalPages} hasMore={hasMore} onPageChange={onPageChange} />
      )}
    </div>
  );
}
