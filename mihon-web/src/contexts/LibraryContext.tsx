"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface LibraryItem {
  id: string;
  mangaId: string;
  sourceId: string;
  title: string;
  cover: string | null;
  status: string | null;
  categories: string;
  addedAt: string;
}

interface LibraryContextType {
  library: LibraryItem[];
  loading: boolean;
  addToLibrary: (item: Omit<LibraryItem, "id" | "addedAt">) => Promise<void>;
  removeFromLibrary: (mangaId: string, sourceId: string) => Promise<void>;
  isInLibrary: (mangaId: string, sourceId: string) => boolean;
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/library");
      const data = await res.json();
      setLibrary(data);
    } catch (error) {
      console.error("Failed to load library:", error);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addToLibrary = async (item: Omit<LibraryItem, "id" | "addedAt">) => {
    try {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      await refresh();
    } catch (error) {
      console.error("Failed to add to library:", error);
    }
  };

  const removeFromLibrary = async (mangaId: string, sourceId: string) => {
    try {
      await fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaId, sourceId }),
      });
      await refresh();
    } catch (error) {
      console.error("Failed to remove from library:", error);
    }
  };

  const isInLibrary = (mangaId: string, sourceId: string) => {
    return library.some((item) => item.mangaId === mangaId && item.sourceId === sourceId);
  };

  return (
    <LibraryContext.Provider value={{ library, loading, addToLibrary, removeFromLibrary, isInLibrary, refresh }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
