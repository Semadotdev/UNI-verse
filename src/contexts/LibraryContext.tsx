"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ApiClient } from "@/lib/api-client";

interface LibraryItem {
  id: string;
  providerId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
  status: string;
  categories: string[];
  folderId: string | null;
  addedAt: string;
  updatedAt: string;
  lastReadChapter: number | null;
  readProgress: number;
  lastReadAt: string | null;
}

interface Folder {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

interface LibraryContextType {
  library: LibraryItem[];
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  loading: boolean;
  addToLibrary: (providerId: string, mangaId: string, title: string, coverUrl: string, folderId?: string | null) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
  isInLibrary: (providerId: string, mangaId: string) => boolean;
  getLibraryItemId: (providerId: string, mangaId: string) => string | null;
  createFolder: (name: string) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveToFolder: (libraryId: string, folderId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  refreshFolders: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshFolders = useCallback(async () => {
    try {
      const items = await ApiClient.get<Folder[]>("/api/library/folders");
      setFolders(items);
    } catch {
      setFolders([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const url = selectedFolderId !== null
        ? `/api/library?folderId=${selectedFolderId}`
        : "/api/library";
      const items = await ApiClient.get<LibraryItem[]>(url);
      setLibrary(items);
    } catch {
      setLibrary([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = selectedFolderId !== null
      ? `/api/library?folderId=${selectedFolderId}`
      : "/api/library";
    ApiClient.get<LibraryItem[]>(url)
      .then((items) => { if (!cancelled) { setLibrary(items); setLoading(false); } })
      .catch(() => { if (!cancelled) { setLibrary([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedFolderId]);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const url = selectedFolderId !== null
          ? `/api/library?folderId=${selectedFolderId}`
          : "/api/library";
        ApiClient.get<LibraryItem[]>(url)
          .then((items) => setLibrary(items))
          .catch(() => {});
        refreshFolders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedFolderId, refreshFolders]);

  const addToLibrary = async (providerId: string, mangaId: string, title: string, coverUrl: string, folderId?: string | null) => {
    try {
      await ApiClient.post("/api/library", {
        providerId,
        mangaId,
        title,
        coverUrl,
        folderId: folderId ?? selectedFolderId,
      });
      await refresh();
      await refreshFolders();
    } catch (error) {
      throw error;
    }
  };

  const removeFromLibrary = async (id: string) => {
    try {
      await ApiClient.delete(`/api/library/${id}`);
      setLibrary((prev) => prev.filter((item) => item.id !== id));
      await refreshFolders();
    } catch (error) {
      throw error;
    }
  };

  const isInLibrary = (providerId: string, mangaId: string) => {
    return library.some((item) => item.providerId === providerId && item.mangaId === mangaId);
  };

  const getLibraryItemId = (providerId: string, mangaId: string) => {
    const item = library.find((item) => item.providerId === providerId && item.mangaId === mangaId);
    return item?.id ?? null;
  };

  const createFolder = async (name: string): Promise<Folder> => {
    const folder = await ApiClient.post<Folder>("/api/library/folders", { name });
    await refreshFolders();
    return folder;
  };

  const renameFolder = async (id: string, name: string) => {
    await ApiClient.put(`/api/library/folders/${id}`, { name });
    await refreshFolders();
  };

  const deleteFolder = async (id: string) => {
    await ApiClient.delete(`/api/library/folders/${id}`);
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
    await refreshFolders();
    await refresh();
  };

  const moveToFolder = async (libraryId: string, folderId: string | null) => {
    await ApiClient.put(`/api/library/${libraryId}/move`, { folderId });
    await refresh();
    await refreshFolders();
  };

  return (
    <LibraryContext.Provider value={{
      library,
      folders,
      selectedFolderId,
      setSelectedFolderId,
      loading,
      addToLibrary,
      removeFromLibrary,
      isInLibrary,
      getLibraryItemId,
      createFolder,
      renameFolder,
      deleteFolder,
      moveToFolder,
      refresh,
      refreshFolders,
    }}>
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
