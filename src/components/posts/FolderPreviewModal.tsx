"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/contexts/ToastContext";
import { Modal } from "@/components/ui/Modal";
import { Check, Plus } from "lucide-react";
import type { PostFolder, FolderPreview, PostFolderItem } from "@/domain/entities/post";

interface FolderPreviewModalProps {
  postId: string;
  folder: PostFolder;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  reading: "bg-primary/15 text-primary-light border-primary/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  planning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  dropped: "bg-red-500/15 text-red-400 border-red-500/30",
  paused: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-600/30",
};

function StatusBadge({ status }: { status: string }) {
  const key = (status || "unknown").toLowerCase();
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[key] ?? STATUS_COLORS.unknown}`}>
      {label}
    </span>
  );
}

export function FolderPreviewModal({ postId, folder, onClose }: FolderPreviewModalProps) {
  const { addToast } = useToast();
  const { isInLibrary, startBatchAdd, batchAdd } = useLibrary();
  const [preview, setPreview] = useState<FolderPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const runningBatch = batchAdd?.key === postId && batchAdd.status === "running" ? batchAdd : null;
  const addingAll = runningBatch !== null;

  useEffect(() => {
    let cancelled = false;
    ApiClient.get<FolderPreview>(`/api/posts/${postId}/folder`)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load folder");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const itemKey = (item: PostFolderItem) => `${item.providerId}:${item.mangaId}`;

  const alreadyAdded = (item: PostFolderItem) =>
    addedIds.has(itemKey(item)) ||
    isInLibrary(item.providerId, item.mangaId) ||
    (batchAdd?.addedKeys.includes(itemKey(item)) ?? false);

  const addOne = async (item: PostFolderItem) => {
    if (adding) return;
    setAdding(item.mangaId);
    try {
      await ApiClient.post("/api/library", {
        providerId: item.providerId,
        mangaId: item.mangaId,
        title: item.title,
        coverUrl: item.coverUrl,
      });
      setAddedIds((prev) => new Set(prev).add(itemKey(item)));
      addToast(`Added "${item.title}" to your library`, "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to add to library", "error");
    } finally {
      setAdding(null);
    }
  };

  const addAll = async () => {
    if (!preview || addingAll) return;
    await startBatchAdd(postId, preview.name, preview.items);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={folder.name}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
          >
            Close
          </button>
          {preview && preview.items.length > 0 && (
            <button
              onClick={addAll}
              disabled={addingAll}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {addingAll
                ? `Adding... ${runningBatch.done}/${runningBatch.total}`
                : "Add folder to my library"}
            </button>
          )}
        </>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {loading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 animate-pulse">
                <div className="h-20 w-14 rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-zinc-800" />
                  <div className="h-3 w-1/3 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="py-6 text-center text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && preview && (
          <>
            <p className="mb-3 text-xs text-muted">
              {preview.itemCount} {preview.itemCount === 1 ? "item" : "items"}
            </p>
            {runningBatch && (
              <div className="mb-3 rounded-lg border border-border bg-bg-overlay p-3">
                <p className="text-xs font-semibold text-zinc-200">
                  Adding to library... {runningBatch.done}/{runningBatch.total}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.round((runningBatch.done / Math.max(runningBatch.total, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  This continues in the background if you close this window.
                </p>
              </div>
            )}
            <div className="space-y-2">
              {preview.items.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">This folder is empty.</p>
              )}
              {preview.items.map((item) => (
                <div
                  key={`${item.providerId}:${item.mangaId}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-bg-raised p-2"
                >
                  <Link
                    href={`/manga/${item.providerId}/${item.mangaId}`}
                    onClick={onClose}
                    className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-bg-overlay hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={ApiClient.imageUrl(item.coverUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/manga/${item.providerId}/${item.mangaId}`}
                      onClick={onClose}
                      className="block text-sm font-semibold text-zinc-100 truncate hover:text-primary-light transition-colors"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  {alreadyAdded(item) ? (
                    <span className="flex shrink-0 items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-green-500/30 bg-green-500/10 text-green-400">
                      <Check className="h-4 w-4" />
                      In library
                    </span>
                  ) : (
                    <button
                      onClick={() => addOne(item)}
                      disabled={adding !== null}
                      className="flex shrink-0 items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {adding === item.mangaId ? "Adding..." : "Add"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
