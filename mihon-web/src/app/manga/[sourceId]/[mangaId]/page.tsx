"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MangaDetail } from "@/components/manga/MangaDetail";
import { ChapterList } from "@/components/manga/ChapterList";
import { Spinner } from "@/components/ui/Spinner";
import { MangaDetails } from "@/lib/sources/types";

export default function MangaPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;

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
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        Manga not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
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
