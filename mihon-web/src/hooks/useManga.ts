"use client";

import { useState, useEffect } from "react";

interface MangaDetails {
  id: string;
  title: string;
  cover: string;
  description?: string;
  status?: string;
  genres?: string[];
  chapters: any[];
}

export function useManga(sourceId: string | null, mangaId: string | null) {
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceId || !mangaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/manga/${sourceId}/${mangaId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load manga");
        return res.json();
      })
      .then((data) => setManga(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load manga");
        setManga(null);
      })
      .finally(() => setLoading(false));
  }, [sourceId, mangaId]);

  return { manga, loading, error };
}
