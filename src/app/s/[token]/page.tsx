"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api-client";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/contexts/ToastContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import type { Manga } from "@/domain/entities/manga";

interface SharedItem {
  providerId: string;
  mangaId: string;
  title: string;
  coverUrl: string;
  categories: string[];
}

interface SharedFolderData {
  folderName: string;
  ownerName: string;
  items: SharedItem[];
}

export default function SharedFolderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { isInLibrary, addToLibrary, createFolder, folders, refreshFolders } = useLibrary();
  const { addToast } = useToast();

  const [data, setData] = useState<SharedFolderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addingFolder, setAddingFolder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ApiClient.get<SharedFolderData>(`/api/shared/${token}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data: { user } }) => setLoggedIn(Boolean(user)));
  }, []);

  const handleAdd = async (item: SharedItem) => {
    const key = `${item.providerId}:${item.mangaId}`;
    if (added.has(key) || isInLibrary(item.providerId, item.mangaId)) return;
    try {
      await addToLibrary(item.providerId, item.mangaId, item.title, item.coverUrl);
      setAdded((prev) => new Set(prev).add(key));
      addToast("Added to library", "success");
    } catch {
      addToast("Failed to add to library", "error");
    }
  };

  const handleAddFolder = async () => {
    if (!data || addingFolder) return;

    if (!loggedIn) {
      router.push(`/login?next=/s/${token}`);
      return;
    }

    setAddingFolder(true);
    try {
      let folderId: string | null = null;
      const existing = folders.find(
        (f) => f.name.toLowerCase() === data.folderName.toLowerCase()
      );
      if (existing) {
        folderId = existing.id;
      } else {
        try {
          const folder = await createFolder(data.folderName);
          folderId = folder.id;
        } catch {
          await refreshFolders();
          const created = folders.find(
            (f) => f.name.toLowerCase() === data.folderName.toLowerCase()
          );
          folderId = created?.id ?? null;
        }
      }

      let addedCount = 0;
      for (const item of data.items) {
        const key = `${item.providerId}:${item.mangaId}`;
        if (added.has(key) || isInLibrary(item.providerId, item.mangaId)) continue;
        try {
          await addToLibrary(item.providerId, item.mangaId, item.title, item.coverUrl, folderId);
          setAdded((prev) => new Set(prev).add(key));
          addedCount += 1;
        } catch {
          addToast(`Failed to add "${item.title}"`, "error");
        }
      }

      if (addedCount > 0) {
        addToast(`Added ${addedCount} to "${data.folderName}"`, "success");
      } else {
        addToast("Everything is already in your library", "success");
      }
    } catch {
      addToast("Failed to add folder to library", "error");
    } finally {
      setAddingFolder(false);
    }
  };

  const mangaItems: Manga[] = (data?.items ?? []).map((item) => ({
    id: item.mangaId,
    providerId: item.providerId,
    title: item.title,
    cover: item.coverUrl,
    status: "unknown" as Manga["status"],
    genres: item.categories,
    description: "",
    alternativeTitles: [],
    authors: [],
    artists: [],
    lastUpdate: null,
  }));

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{data?.folderName ?? "Shared Folder"}</h1>
          <p className="text-muted text-sm mt-1">
            {data
              ? `${data.items.length} manga · shared by ${data.ownerName}`
              : "Loading..."}
          </p>
        </div>
        {data && data.items.length > 0 && (
          loggedIn ? (
            <button
              onClick={handleAddFolder}
              disabled={addingFolder}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingFolder ? "Adding..." : "Add folder to my library"}
            </button>
          ) : (
            <button
              onClick={handleAddFolder}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
            >
              Log in to add to your library
            </button>
          )
        )}
      </div>

      {loading ? (
        <MangaGridSkeleton count={12} />
      ) : notFound || !data ? (
        <div className="text-center py-20">
          <svg className="h-16 w-16 mx-auto mb-4 text-primary/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M18.364 5.636a9 9 0 1 0 0 12.728m0-12.728a9 9 0 1 1 0 12.728m0-12.728L12 12m6.364 6.364L12 12" />
          </svg>
          <p className="text-lg font-semibold mb-2 text-zinc-300">
            This shared folder doesn&apos;t exist or was unshared
          </p>
          <p className="text-sm text-muted">
            Check the link or ask the owner to re-share it
          </p>
        </div>
      ) : mangaItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold mb-2 text-zinc-300">This folder is empty</p>
          <p className="text-sm text-muted">No manga have been added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {mangaItems.map((m, i) => {
            const item = data.items[i];
            const alreadyAdded = isInLibrary(item.providerId, item.mangaId);
            const key = `${item.providerId}:${item.mangaId}`;
            return (
              <MangaCard
                key={key}
                manga={m}
                onAdd={
                  loggedIn && !alreadyAdded && !added.has(key)
                    ? () => handleAdd(item)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
