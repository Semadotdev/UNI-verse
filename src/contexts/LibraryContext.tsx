"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";

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

export interface BatchAddItem {
  providerId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
}

export interface BatchAddState {
  status: 'running' | 'done';
  key: string;
  folderName: string;
  total: number;
  done: number;
  failed: number;
  addedKeys: string[];
  currentTitle: string | null;
  reopenUrl: string | null;
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
  batchAdd: BatchAddState | null;
  startBatchAdd: (key: string, folderName: string, items: BatchAddItem[], opts?: { reopenUrl?: string }) => Promise<void>;
  dismissBatchAdd: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchAdd, setBatchAdd] = useState<BatchAddState | null>(null);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToast();

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

  const addLibraryItem = async (providerId: string, mangaId: string, title: string, coverUrl: string, folderId: string | null) => {
    await ApiClient.post("/api/library", { providerId, mangaId, title, coverUrl, folderId });
  };

  const dismissBatchAdd = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    setBatchAdd(null);
  }, []);

  const startBatchAdd = useCallback(async (key: string, folderName: string, items: BatchAddItem[], opts?: { reopenUrl?: string }) => {
    if (batchAdd?.status === 'running') return;
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    const initialKeys = items
      .map((i) => `${i.providerId}:${i.mangaId}`)
      .filter((itemKey) => library.some((l) => l.providerId === itemKey.split(":")[0] && l.mangaId === itemKey.split(":")[1]));
    setBatchAdd({
      status: 'running',
      key,
      folderName,
      total: items.length,
      done: 0,
      failed: 0,
      addedKeys: initialKeys,
      currentTitle: null,
      reopenUrl: opts?.reopenUrl ?? null,
    });

    try {
      let folderId: string | null = null;
      const existing = folders.find((f) => f.name.toLowerCase() === folderName.toLowerCase());
      if (existing) {
        folderId = existing.id;
      } else {
        try {
          const folder = await createFolder(folderName);
          folderId = folder.id;
        } catch {
          await refreshFolders();
          const created = folders.find((f) => f.name.toLowerCase() === folderName.toLowerCase());
          folderId = created?.id ?? null;
        }
      }

      let done = 0;
      let failed = 0;
      const addedKeys = new Set(initialKeys);
      for (const item of items) {
        const itemKey = `${item.providerId}:${item.mangaId}`;
        setBatchAdd((prev) => prev ? { ...prev, currentTitle: item.title } : prev);
        if (addedKeys.has(itemKey) || isInLibrary(item.providerId, item.mangaId)) {
          done += 1;
          setBatchAdd((prev) => prev ? { ...prev, done, failed } : prev);
          continue;
        }
        try {
          await addLibraryItem(item.providerId, item.mangaId, item.title, item.coverUrl, folderId);
          addedKeys.add(itemKey);
          done += 1;
          setBatchAdd((prev) => prev ? { ...prev, done, failed, addedKeys: Array.from(addedKeys) } : prev);
        } catch {
          failed += 1;
          done += 1;
          setBatchAdd((prev) => prev ? { ...prev, done, failed } : prev);
        }
      }

      await refresh();
      await refreshFolders();

      const addedCount = done - failed;
      if (addedCount > 0 && failed === 0) {
        addToast(`Added ${addedCount} to "${folderName}"`, "success");
      } else if (addedCount > 0) {
        addToast(`Added ${addedCount} to "${folderName}", ${failed} failed`, "warning");
      } else if (failed > 0) {
        addToast(`Failed to add ${failed} items`, "error");
      } else {
        addToast("Everything is already in your library", "success");
      }

      setBatchAdd((prev) => prev ? { ...prev, status: 'done', currentTitle: null } : prev);
      batchTimerRef.current = setTimeout(() => {
        setBatchAdd(null);
        batchTimerRef.current = null;
      }, 3000);
    } catch {
      addToast("Failed to add folder to library", "error");
      setBatchAdd(null);
    }
  }, [batchAdd?.status, folders, library, createFolder, refresh, refreshFolders, isInLibrary, addToast]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

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
      batchAdd,
      startBatchAdd,
      dismissBatchAdd,
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
