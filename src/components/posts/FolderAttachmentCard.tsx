"use client";

import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import type { PostFolder } from "@/domain/entities/post";

export function FolderAttachmentCard({ folder }: { folder: PostFolder }) {
  return (
    <div className="rounded-xl border border-border bg-bg-raised overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-zinc-200 truncate">{folder.name}</span>
        <span className="text-xs text-muted shrink-0 ml-2">
          {folder.itemCount} {folder.itemCount === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto p-2">
        {folder.covers.map((cover) => (
          <Link
            key={`${cover.providerId}:${cover.mangaId}`}
            href={`/manga/${cover.providerId}/${cover.mangaId}`}
            className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-bg-overlay hover:opacity-90 transition-opacity"
          >
            <img
              src={ApiClient.imageUrl(cover.coverUrl)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
