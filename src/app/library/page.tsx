"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/contexts/ToastContext";
import { ApiClient } from "@/lib/api-client";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import type { Manga } from "@/domain/entities/manga";

export default function LibraryPage() {
  const {
    library,
    folders,
    selectedFolderId,
    setSelectedFolderId,
    loading,
    removeFromLibrary,
    createFolder,
    renameFolder,
    deleteFolder,
    refresh,
    refreshFolders,
  } = useLibrary();
  const { addToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [folderActions, setFolderActions] = useState<{ id: string; name: string } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [shareData, setShareData] = useState<{ token: string; url: string } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<{ id: string; name: string } | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreateModal) createInputRef.current?.focus();
  }, [showCreateModal]);

  useEffect(() => {
    if (renameTarget) renameInputRef.current?.focus();
  }, [renameTarget]);

  useEffect(() => {
    refresh();
    refreshFolders();
  }, [refresh, refreshFolders]);

  const handleRemove = useCallback(
    (libraryId: string) => {
      setConfirmRemove(libraryId);
    },
    []
  );

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createFolder(name);
      setNewFolderName("");
      setShowCreateModal(false);
    } catch {
      // duplicate name or error
    }
  };

  const handleRenameFolder = async () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    try {
      await renameFolder(renameTarget.id, name);
      setRenameTarget(null);
      setRenameName("");
    } catch {
      // duplicate name or error
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    setConfirmDeleteFolder({ id: folderId, name: folder?.name ?? "this folder" });
  };

  const openShare = async (folderId: string, name: string) => {
    setFolderActions(null);
    setShareTarget({ id: folderId, name });
    setShareData(null);
    setShareLoading(true);
    try {
      const data = await ApiClient.get<{ token: string; url: string } | null>(
        `/api/library/folders/${folderId}/share`
      );
      setShareData(data);
    } catch {
      addToast("Failed to load share link", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const createShare = async () => {
    if (!shareTarget) return;
    setShareLoading(true);
    try {
      const data = await ApiClient.post<{ token: string; url: string }>(
        `/api/library/folders/${shareTarget.id}/share`
      );
      setShareData(data);
    } catch {
      addToast("Failed to create share link", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const stopSharing = async () => {
    if (!shareTarget) return;
    setShareLoading(true);
    try {
      await ApiClient.delete(`/api/library/folders/${shareTarget.id}/share`);
      setShareData(null);
      addToast("Sharing stopped", "info");
    } catch {
      addToast("Failed to stop sharing", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareData) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${shareData.url}`);
      addToast("Link copied", "success");
    } catch {
      addToast("Copy failed", "error");
    }
  };

  const totalItems = folders.reduce((sum, f) => sum + f.count, 0);

  const mangaItems: (Manga & { libraryId: string; readProgress: number })[] = library.map((item) => ({
    id: item.mangaId,
    providerId: item.providerId,
    title: item.title,
    cover: item.coverUrl,
    status: "unknown" as Manga["status"],
    genres: item.categories || [],
    description: "",
    alternativeTitles: [],
    authors: [],
    artists: [],
    lastUpdate: null,
    latestChapter: item.lastReadChapter ?? undefined,
    libraryId: item.id,
    readProgress: item.readProgress,
  }));

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted text-sm mt-1">
          {totalItems || library.length} manga in your collection
        </p>
      </div>

      {/* Folder tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFolderId(null)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
            selectedFolderId === null
              ? "bg-primary text-white"
              : "bg-surface hover:bg-surface-hover text-muted"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedFolderId("null")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
            selectedFolderId === "null"
              ? "bg-primary text-white"
              : "bg-surface hover:bg-surface-hover text-muted"
          }`}
        >
          Uncategorized
        </button>

        {folders.map((folder) => (
          <div key={folder.id} className="relative whitespace-nowrap">
            <button
              onClick={() => setSelectedFolderId(folder.id)}
              className={`px-3 py-1.5 pr-7 text-sm rounded-lg transition-colors ${
                selectedFolderId === folder.id
                  ? "bg-primary text-white"
                  : "bg-surface hover:bg-surface-hover text-muted"
              }`}
            >
              {folder.name}
              <span className="ml-1 opacity-60">{folder.count}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFolderActions({ id: folder.id, name: folder.name });
              }}
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                selectedFolderId === folder.id
                  ? "hover:bg-white/20 text-white/70"
                  : "hover:bg-zinc-600 text-zinc-400"
              }`}
              aria-label={`Settings for ${folder.name}`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-zinc-600 hover:border-zinc-400 text-muted hover:text-white transition-colors whitespace-nowrap"
        >
          + New Folder
        </button>
      </div>

      {/* Manga grid */}
      {loading ? (
        <MangaGridSkeleton count={12} />
      ) : mangaItems.length === 0 ? (
        <div className="text-center py-20">
          <svg className="h-16 w-16 mx-auto mb-4 text-primary/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <p className="text-lg font-semibold mb-2 text-zinc-300">
            {selectedFolderId === null
              ? "Your library is empty"
              : selectedFolderId === "null"
                ? "No uncategorized manga"
                : "This folder is empty"}
          </p>
          <p className="text-sm text-muted">
            {selectedFolderId === null
              ? "Search for manga to add them to your collection"
              : "Move manga into this folder from the detail page"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {mangaItems.map((m) => (
            <MangaCard
              key={`${m.providerId}-${m.id}`}
              manga={m}
              showChapterBadge
              readProgress={m.readProgress}
              onRemove={() => handleRemove(m.libraryId)}
            />
          ))}
        </div>
      )}

      {/* Folder actions modal */}
      <Modal
        open={folderActions !== null}
        onClose={() => setFolderActions(null)}
        title={folderActions?.name}
        size="sm"
      >
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (folderActions) {
                setRenameTarget({ id: folderActions.id, name: folderActions.name });
                setRenameName(folderActions.name);
              }
              setFolderActions(null);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left rounded-lg hover:bg-zinc-800 text-zinc-200 transition-colors"
          >
            <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Rename
          </button>
          <button
            onClick={() => {
              if (folderActions) openShare(folderActions.id, folderActions.name);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left rounded-lg hover:bg-zinc-800 text-zinc-200 transition-colors"
          >
            <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
          <button
            onClick={() => {
              if (folderActions) handleDeleteFolder(folderActions.id);
              setFolderActions(null);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewFolderName(""); }}
        title="New Folder"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setShowCreateModal(false); setNewFolderName(""); }}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
            >
              Create
            </button>
          </>
        }
      >
        <input
          ref={createInputRef}
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateFolder();
            if (e.key === "Escape") { setShowCreateModal(false); setNewFolderName(""); }
          }}
          placeholder="Folder name"
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-primary transition-colors"
        />
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        open={renameTarget !== null}
        onClose={() => { setRenameTarget(null); setRenameName(""); }}
        title="Rename Folder"
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setRenameTarget(null); setRenameName(""); }}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleRenameFolder}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
            >
              Save
            </button>
          </>
        }
      >
        <input
          ref={renameInputRef}
          value={renameName}
          onChange={(e) => setRenameName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameFolder();
            if (e.key === "Escape") { setRenameTarget(null); setRenameName(""); }
          }}
          placeholder="Folder name"
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-primary transition-colors"
        />
      </Modal>

      {/* Confirm remove manga modal */}
      <Modal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title="Remove from library"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmRemove(null)}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmRemove) removeFromLibrary(confirmRemove);
                setConfirmRemove(null);
              }}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-300">Are you sure you want to remove this manga from your library?</p>
      </Modal>

      {/* Confirm delete folder modal */}
      <Modal
        open={confirmDeleteFolder !== null}
        onClose={() => setConfirmDeleteFolder(null)}
        title="Delete folder"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmDeleteFolder(null)}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmDeleteFolder) deleteFolder(confirmDeleteFolder.id);
                setConfirmDeleteFolder(null);
              }}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-300">
          Delete folder <span className="font-semibold text-zinc-100">&ldquo;{confirmDeleteFolder?.name}&rdquo;</span>?
          All manga in this folder will be moved to Uncategorized.
        </p>
      </Modal>

      {/* Share folder modal */}
      <Modal
        open={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        title={`Share "${shareTarget?.name}"`}
        size="sm"
      >
        {shareLoading ? (
          <div className="py-6 text-center text-sm text-muted">Loading...</div>
        ) : shareData ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Anyone with this link can view this folder.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}${shareData.url}`}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
              >
                Copy
              </button>
            </div>
            <button
              onClick={stopSharing}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Stop sharing
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">Share this folder with a public link.</p>
            <button
              onClick={createShare}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
            >
              Create share link
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
