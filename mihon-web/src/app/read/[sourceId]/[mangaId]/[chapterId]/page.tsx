"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageReader } from "@/components/reader/PageReader";
import { WebtoonReader } from "@/components/reader/WebtoonReader";
import { ReaderControls } from "@/components/reader/ReaderControls";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft } from "lucide-react";

export default function ReadPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerMode, setReaderMode] = useState<"page" | "webtoon">("page");
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pages/${sourceId}/${chapterId}`);
        const data = await res.json();
        setPages(data);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceId, chapterId]);

  const handlePageChange = (page: number) => {
    // Track reading progress
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mangaId,
        sourceId,
        chapterId,
        progress: page / Math.max(1, pages.length - 1),
      }),
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/manga/${sourceId}/${mangaId}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <ReaderControls
          direction={direction}
          onDirectionChange={setDirection}
          onSettingsClick={() =>
            setReaderMode(readerMode === "page" ? "webtoon" : "page")
          }
        />
      </div>

      {readerMode === "page" ? (
        <PageReader
          pages={pages}
          direction={direction}
          onPageChange={handlePageChange}
        />
      ) : (
        <WebtoonReader pages={pages} onProgress={handlePageChange} />
      )}
    </div>
  );
}
