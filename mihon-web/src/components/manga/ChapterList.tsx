"use client";

import Link from "next/link";
import { Chapter } from "@/lib/sources/types";

interface ChapterListProps {
  chapters: Chapter[];
  sourceId: string;
  mangaId: string;
}

export function ChapterList({ chapters, sourceId, mangaId }: ChapterListProps) {
  return (
    <div className="mt-6">
      <h2 className="mb-4 text-lg font-semibold">Chapters</h2>
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/read/${sourceId}/${mangaId}/${chapter.id}`}
            className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800"
          >
            <div>
              <span className="font-medium">Chapter {chapter.number}</span>
              {chapter.title && (
                <span className="ml-2 text-zinc-400">- {chapter.title}</span>
              )}
            </div>
            {chapter.date && (
              <span className="text-sm text-zinc-500">
                {new Date(chapter.date).toLocaleDateString()}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
