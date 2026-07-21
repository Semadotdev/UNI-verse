"use client";

import { useEffect, useState } from "react";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export default function LibraryPage() {
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/library");
        const data = await res.json();
        setLibrary(data);
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredLibrary = filter
    ? library.filter((item) => item.categories.split(",").includes(filter))
    : library;

  const categories = [
    ...new Set(library.flatMap((item) => item.categories.split(",").filter(Boolean))),
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Library</h1>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === null ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
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

      {filteredLibrary.length > 0 ? (
        <MangaGrid
          manga={filteredLibrary.map((item) => ({
            id: item.mangaId,
            title: item.title,
            cover: item.cover || "",
            status: item.status,
          }))}
          sourceId={filteredLibrary[0]?.sourceId || "mangadex"}
        />
      ) : (
        <p className="text-center text-zinc-500">
          Your library is empty. Search and add manga to get started!
        </p>
      )}
    </div>
  );
}
