"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { NsfwBadge } from "@/components/ui/NsfwBadge";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import type { Post } from "@/domain/entities/post";

interface FolderOption {
  id: string;
  name: string;
  count: number;
  nsfw: boolean;
}

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
}

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
  folders: FolderOption[];
  viewer: Viewer | null;
  editing: Post | null;
  onSaved: (post: Post) => void;
}

export function PostComposer({ open, onClose, folders, viewer, editing, onSaved }: PostComposerProps) {
  const [body, setBody] = useState(editing?.body ?? "");
  const [folderId, setFolderId] = useState<string | null>(editing?.folder?.id ?? null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [nsfw, setNsfw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const selectedFolder = folders.find((f) => f.id === folderId);
  const forceNsfw = selectedFolder?.nsfw === true;
  const effectiveNsfw = nsfw || forceNsfw;

  const publish = async () => {
    if (saving) return;
    const text = body.trim();
    if (!text && !folderId && images.length === 0) {
      addToast("Write something to post", "warning");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await ApiClient.put<Post>(`/api/posts/${editing.id}`, { body: text, folderId });
        onSaved(updated);
      } else {
        const created = await ApiClient.post<Post>("/api/posts", { body: text, folderId, imageUrls: images, nsfw });
        onSaved(created);
      }
      addToast(editing ? "Post updated" : "Post published", "success");
      reset();
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to save post", "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setBody("");
    setFolderId(null);
    setImages([]);
    setNsfw(false);
  };

  const pickImages = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length + 1 > 4) {
        addToast("Max 4 images per post", "warning");
        break;
      }
      setUploading(true);
      try {
        const { url } = await ApiClient.upload<{ url: string }>("/api/uploads", file);
        setImages((prev) => [...prev, url]);
      } catch (e) {
        addToast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit post" : "Create post"}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={publish}
            disabled={saving || uploading}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? "Publishing..." : editing ? "Save changes" : "Publish"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          {viewer?.avatarUrl ? (
            <img src={viewer.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover bg-bg-overlay shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/30 shrink-0" />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share something..."
            className="flex-1 resize-none rounded-lg border border-border bg-bg-overlay px-3 py-2 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:border-primary/50"
          />
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover bg-bg-overlay" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setFolderPickerOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              {folderId ? folders.find((f) => f.id === folderId)?.name ?? "Folder" : "Attach folder"}
            </button>
            {folderPickerOpen && (
              <div className="absolute top-10 left-0 z-30 w-56 rounded-xl border border-border bg-bg-raised shadow-lg py-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setFolderId(null);
                    setFolderPickerOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-bg-overlay transition-colors"
                >
                  No folder
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setFolderId(folder.id);
                      setFolderPickerOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-bg-overlay transition-colors"
                  >
                    <span className="truncate">{folder.name}</span>
                    <span className="text-xs text-muted shrink-0">{folder.count}</span>
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted">No folders yet</p>
                )}
              </div>
            )}
          </div>

          {!editing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => pickImages(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length >= 4}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {uploading ? "Uploading..." : "Add image"}
              </button>
            </>
          )}
        </div>

        <label className="flex items-center gap-2">
          <Toggle
            checked={effectiveNsfw}
            disabled={forceNsfw}
            onChange={setNsfw}
          />
          {effectiveNsfw && <NsfwBadge />}
          <span className="text-xs text-muted">
            {forceNsfw ? "This folder contains NSFW content" : "Mark as NSFW"}
          </span>
        </label>
      </div>
    </Modal>
  );
}
