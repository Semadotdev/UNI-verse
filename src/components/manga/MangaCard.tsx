"use client";

import { useState } from "react";
import Link from "next/link";
import type { Manga } from "@/domain/entities/manga";
import { ApiClient } from "@/lib/api-client";
import { FallbackCover } from "@/components/manga/FallbackCover";

interface MangaCardProps {
  manga: Manga;
  showChapterBadge?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
  readProgress?: number;
}

export function MangaCard({ manga, showChapterBadge = false, onRemove, onAdd, readProgress }: MangaCardProps) {
  const imageUrl = manga.cover ? ApiClient.imageUrl(manga.cover) : null;
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/manga/${manga.providerId}/${manga.id}`}
      className="group block"
    >
      {/* Cover */}
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-bg-raised mb-2.5 relative shadow-card group-hover:shadow-card-hover transition-all duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={manga.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <FallbackCover size="md" />
        )}

        {/* Purple gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-purple-900/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Chapter/Page count badge */}
        {showChapterBadge && (manga.pageCount || manga.latestChapter) && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-md text-[11px] font-semibold text-zinc-200 border border-white/10">
            {manga.pageCount ? `Pgs. ${manga.pageCount}` : `Ch. ${manga.latestChapter}`}
          </div>
        )}

        {/* Add button */}
        {onAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            className="absolute top-2 left-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-primary/90 text-white hover:bg-primary border border-white/10 shadow-lg transition-colors duration-150"
            aria-label="Add to library"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm text-zinc-300 hover:text-red-400 hover:bg-black/90 border border-white/10 transition-colors duration-150"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Status badge (hidden when remove button is present) */}
        {!onRemove && manga.status && manga.status !== "unknown" && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm bg-primary/25 text-primary-light border border-primary/30">
            {manga.status.replace("_", " ")}
          </div>
        )}

        {/* Hover play indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-glow scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="h-5 w-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Read indicator — library view only */}
        {onRemove && manga.latestChapter != null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/80" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary-light transition-colors duration-200">
        {manga.title}
      </h3>

      {/* Genre pills */}
      {manga.genres.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {manga.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary-light border border-primary/20"
            >
              {genre}
            </span>
          ))}
          {manga.genres.length > 2 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-bg-overlay text-muted-foreground border border-border/50">
              +{manga.genres.length - 2}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
