"use client";

import Link from "next/link";
import { SearchResult } from "@/lib/sources/types";

interface MangaCardProps {
  manga: SearchResult;
  sourceId: string;
}

export function MangaCard({ manga, sourceId }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${sourceId}/${manga.id}`}
      className="group block overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 transition-all hover:border-zinc-700 hover:shadow-lg"
    >
      <div className="aspect-[2/3] overflow-hidden bg-zinc-800">
        <img
          src={`/api/image?url=${encodeURIComponent(manga.cover)}`}
          alt={manga.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-2">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-100">
          {manga.title}
        </h3>
        {manga.status && (
          <p className="mt-1 text-xs text-zinc-500 capitalize">{manga.status}</p>
        )}
      </div>
    </Link>
  );
}
