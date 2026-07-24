"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useLibrary } from "@/contexts/LibraryContext";
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
  } = useLibrary();

  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<{ id: string; name: string } | null>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const editFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNewFolderInput) newFolderInputRef.current?.focus();
  }, [showNewFolderInput]);

  useEffect(() => {
    if (editingFolderId) editFolderInputRef.current?.focus();
  }, [editingFolderId]);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

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
      setShowNewFolderInput(false);
    } catch {
      // duplicate name or error
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolderId) return;
    const name = editingFolderName.trim();
    if (!name) return;
    try {
      await renameFolder(editingFolderId, name);
      setEditingFolderId(null);
      setEditingFolderName("");
    } catch {
      // duplicate name or error
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setContextMenu(null);
    const folder = folders.find((f) => f.id === folderId);
    setConfirmDeleteFolder({ id: folderId, name: folder?.name ?? "this folder" });
  };

  const totalItems = folders.reduce((sum, f) => sum + f.count, 0);

  const mangaItems: (Manga & { libraryId: string })[] = library.map((item) => ({
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
    libraryId: item.id,
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
            {editingFolderId === folder.id ? (
              <input
                ref={editFolderInputRef}
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameFolder();
                  if (e.key === "Escape") setEditingFolderId(null);
                }}
                onBlur={handleRenameFolder}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-primary text-white outline-none w-28"
              />
            ) : (
              <button
                onClick={() => setSelectedFolderId(folder.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY });
                }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedFolderId === folder.id
                    ? "bg-primary text-white"
                    : "bg-surface hover:bg-surface-hover text-muted"
                }`}
              >
                {folder.name}
                <span className="ml-1 opacity-60">{folder.count}</span>
              </button>
            )}
          </div>
        ))}

        {showNewFolderInput ? (
          <input
            ref={newFolderInputRef}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") { setShowNewFolderInput(false); setNewFolderName(""); }
            }}
            onBlur={() => { if (!newFolderName.trim()) setShowNewFolderInput(false); }}
            placeholder="Folder name"
            className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-primary text-white outline-none w-32"
          />
        ) : (
          <button
            onClick={() => setShowNewFolderInput(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-zinc-600 hover:border-zinc-400 text-muted hover:text-white transition-colors whitespace-nowrap"
          >
            + New Folder
          </button>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const folder = folders.find((f) => f.id === contextMenu.folderId);
              if (folder) {
                setEditingFolderId(contextMenu.folderId);
                setEditingFolderName(folder.name);
              }
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 text-zinc-200"
          >
            Rename
          </button>
          <button
            onClick={() => handleDeleteFolder(contextMenu.folderId)}
            className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 text-red-400"
          >
            Delete Folder
          </button>
        </div>
      )}

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
              onRemove={() => handleRemove(m.libraryId)}
            />
          ))}
        </div>
      )}

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
          Delete folder <span className="font-semibold text-zinc-100">"{confirmDeleteFolder?.name}"</span>?
          Manga inside will not be deleted.
        </p>
      </Modal>
    </div>
  );
}
