"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLibrary } from "@/contexts/LibraryContext";
import { FolderPreviewModal } from "@/components/posts/FolderPreviewModal";
import { Check, X } from "lucide-react";
import type { PostFolder } from "@/domain/entities/post";

export function BatchAddProgress() {
  const { batchAdd, dismissBatchAdd } = useLibrary();
  const router = useRouter();
  const [reopenPostId, setReopenPostId] = useState<string | null>(null);

  if (!batchAdd) return null;

  const percent =
    batchAdd.total === 0
      ? 100
      : Math.round((batchAdd.done / batchAdd.total) * 100);

  const folder: PostFolder = {
    id: batchAdd.key,
    name: batchAdd.folderName,
    itemCount: 0,
    covers: [],
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-72 cursor-pointer rounded-xl border border-border bg-bg-raised p-3 shadow-xl"
        onClick={() => {
          if (batchAdd.status !== "running") return;
          if (batchAdd.reopenUrl) {
            router.push(batchAdd.reopenUrl);
          } else {
            setReopenPostId(batchAdd.key);
          }
        }}
      >
        {batchAdd.status === "running" ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200">
                  Adding to library... {batchAdd.done}/{batchAdd.total}
                </p>
                {batchAdd.currentTitle && (
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {batchAdd.currentTitle}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissBatchAdd();
                }}
                className="shrink-0 rounded-full p-1 text-muted hover:bg-bg-overlay hover:text-zinc-100 transition-colors"
                aria-label="Hide progress"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-overlay">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
              <Check className="h-3 w-3" />
            </span>
            <p className="min-w-0 truncate text-xs font-semibold text-zinc-200">
              Added {batchAdd.done - batchAdd.failed} to &ldquo;{batchAdd.folderName}&rdquo;
              {batchAdd.failed > 0 ? `, ${batchAdd.failed} failed` : ""}
            </p>
          </div>
        )}
      </div>

      {reopenPostId && batchAdd && batchAdd.key === reopenPostId && (
        <FolderPreviewModal
          postId={reopenPostId}
          folder={folder}
          onClose={() => setReopenPostId(null)}
        />
      )}
    </>
  );
}
