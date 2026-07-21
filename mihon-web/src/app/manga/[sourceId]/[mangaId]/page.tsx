"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MangaDetail } from "@/components/manga/MangaDetail";
import { ChapterList } from "@/components/manga/ChapterList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { MangaDetails } from "@/lib/sources/types";

export default function MangaPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;
  const { addToast } = useToast();

  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/manga/${sourceId}/${mangaId}`);
        const data = await res.json();
        setManga(data);
      } catch (error) {
        console.error("Failed to load manga:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceId, mangaId]);

  const handleLibraryToggle = async () => {
    if (!manga) return;

    if (isInLibrary) {
      await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId, sourceId }),
      });
      setIsInLibrary(false);
      addToast("Removed from library", "info");
    } else {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          sourceId,
          title: manga.title,
          cover: manga.cover,
          status: manga.status,
        }),
      });
      setIsInLibrary(true);
      addToast("Added to library", "success");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col sm:flex-row gap-6">
          <Skeleton variant="rectangle" className="h-72 w-48 flex-shrink-0 mx-auto sm:mx-0" />
          <div className="flex-1 space-y-4">
            <Skeleton variant="text" lines={2} className="h-7" />
            <Skeleton variant="text" lines={3} className="h-4" />
            <Skeleton variant="rectangle" className="h-10 w-36" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangle" className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          title="Manga not found"
          description="This manga may no longer be available from this source."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 animate-fade-in-up">
      <MangaDetail
        manga={manga}
        sourceId={sourceId}
        isInLibrary={isInLibrary}
        onLibraryToggle={handleLibraryToggle}
      />
      <ChapterList
        chapters={manga.chapters}
        sourceId={sourceId}
        mangaId={mangaId}
      />
    </div>
  );
}
