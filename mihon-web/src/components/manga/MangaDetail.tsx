"use client";

import { MangaDetails } from "@/lib/sources/types";
import { Button } from "@/components/ui/Button";
import { Plus, Check } from "lucide-react";

interface MangaDetailProps {
  manga: MangaDetails;
  sourceId: string;
  isInLibrary: boolean;
  onLibraryToggle: () => void;
}

export function MangaDetail({
  manga,
  sourceId,
  isInLibrary,
  onLibraryToggle,
}: MangaDetailProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="w-full flex-shrink-0 md:w-64">
        <img
          src={`/api/image?url=${encodeURIComponent(manga.cover)}`}
          alt={manga.title}
          className="w-full rounded-lg object-cover shadow-lg"
        />
      </div>
      <div className="flex-1">
        <h1 className="mb-2 text-2xl font-bold">{manga.title}</h1>
        {manga.status && (
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">
            {manga.status}
          </span>
        )}
        {manga.description && (
          <p className="mb-4 text-zinc-400">{manga.description}</p>
        )}
        {manga.genres && manga.genres.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {manga.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
        <Button onClick={onLibraryToggle} variant={isInLibrary ? "secondary" : "primary"}>
          {isInLibrary ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              In Library
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add to Library
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
