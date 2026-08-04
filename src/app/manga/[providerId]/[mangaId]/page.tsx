"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useManga } from "@/hooks/use-manga";
import { useLibrary } from "@/contexts/LibraryContext";
import { useToast } from "@/contexts/ToastContext";
import { ApiClient } from "@/lib/api-client";
import { FallbackCover } from "@/components/manga/FallbackCover";
import { Spinner } from "@/components/ui/Spinner";
import type { Manga } from "@/domain/entities/manga";

export default function MangaDetailPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const mangaId = params.mangaId as string;
  const { manga, chapters, loading, error, fetchManga } = useManga();
  const { isInLibrary, addToLibrary, removeFromLibrary, library, folders, moveToFolder } = useLibrary();
  const { addToast } = useToast();
  const [sortBy, setSortBy] = useState<"chapter" | "date">("chapter");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showAddFolderPicker, setShowAddFolderPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    { type: "add" | "move"; folderId: string | null } | null
  >(null);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const folderPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchManga(providerId, mangaId);
  }, [providerId, mangaId, fetchManga]);

  useEffect(() => {
    ApiClient.get<{ readChapters: string[] }>(`/api/history/read?providerId=${providerId}&mangaId=${mangaId}`)
      .then((data) => setReadChapters(new Set(data.readChapters)))
      .catch(() => {});
  }, [providerId, mangaId]);

  useEffect(() => {
    if (!showFolderPicker && !showAddFolderPicker) return;
    const handler = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
        setShowAddFolderPicker(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showFolderPicker, showAddFolderPicker]);

  const libraryItem = library.find(
    (item) => item.providerId === providerId && item.mangaId === mangaId
  );
  const inLibrary = isInLibrary(providerId, mangaId);

  const folderName = (folderId: string | null) =>
    folderId ? folders.find((f) => f.id === folderId)?.name ?? "Unknown" : "Uncategorized";

  const handleLibraryToggle = async (folderId?: string | null) => {
    setPendingAction({ type: "add", folderId: folderId ?? null });
    try {
      if (inLibrary && libraryItem) {
        await removeFromLibrary(libraryItem.id);
        addToast("Removed from Library", "success");
      } else if (manga) {
        await addToLibrary(providerId, mangaId, manga.title, manga.cover, folderId ?? undefined);
        addToast(folderId ? `Added to "${folderName(folderId)}"` : "Added to Library", "success");
      }
      setShowAddFolderPicker(false);
    } catch {
      addToast("Failed to update library", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    setPendingAction({ type: "move", folderId });
    try {
      if (libraryItem) {
        await moveToFolder(libraryItem.id, folderId);
        addToast(folderId ? `Moved to "${folderName(folderId)}"` : "Moved to Uncategorized", "success");
      }
      setShowFolderPicker(false);
    } catch {
      addToast("Failed to move to folder", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const currentFolderName = libraryItem?.folderId
    ? folders.find((f) => f.id === libraryItem.folderId)?.name ?? "Unknown"
    : "Uncategorized";

  const toTime = (d: Date | string | null | undefined) =>
    d ? new Date(d).getTime() || 0 : 0;

  const sortedChapters = [...chapters].sort((a, b) => {
    if (sortBy === "chapter") return (b.number ?? 0) - (a.number ?? 0);
    return toTime(b.uploadDate) - toTime(a.uploadDate);
  });

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="relative h-[360px] bg-bg-raised animate-pulse" />
        <div className="container mx-auto px-4 md:px-8 -mt-24 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 shrink-0">
              <div className="aspect-[3/4] bg-bg-overlay rounded-xl animate-pulse" />
            </div>
            <div className="flex-1 space-y-4 pt-16 md:pt-24">
              <div className="h-9 bg-border rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-border rounded w-1/3 animate-pulse" />
              <div className="h-20 bg-border rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !manga) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <svg className="h-16 w-16 mx-auto mb-4 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <p className="text-lg font-semibold mb-2">Failed to load manga</p>
        <p className="text-sm text-muted mb-6">{error || "Manga not found"}</p>
        <Link href="/" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
          Go Home
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ongoing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    completed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
    on_hiatus: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  };

  return (
    <div className="min-h-screen">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-bg-raised/80 border border-border hover:border-primary shadow-lg backdrop-blur-md text-muted hover:text-zinc-100 transition-all duration-200"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </Link>

      {/* Hero backdrop */}
      <div className="relative h-[200px] md:h-[360px] overflow-hidden">
        {manga.cover && (
          <img
            src={ApiClient.imageUrl(manga.cover)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
        {/* Purple ambient glow */}
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-8 -mt-20 md:-mt-32 relative z-10 pb-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="w-full md:w-64 shrink-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-bg-overlay shadow-glow-lg border border-primary/20">
              <MangaDetailCover manga={manga} />
            </div>
            <button
              onClick={() => inLibrary ? setShowFolderPicker(!showFolderPicker) : setShowAddFolderPicker(!showAddFolderPicker)}
              disabled={pendingAction !== null}
              className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                inLibrary
                  ? "bg-bg-overlay text-zinc-300 hover:bg-border border border-border hover:border-border-hover"
                  : "bg-primary hover:bg-primary-hover text-white shadow-glow hover:shadow-glow-lg"
              }`}
            >
              {pendingAction ? (
                <>
                  <Spinner size="sm" />
                  {pendingAction.type === "add" ? "Adding…" : "Moving…"}
                </>
              ) : inLibrary ? (
                "✓ In Library"
              ) : (
                "+ Add to Library"
              )}
            </button>

            {/* Folder picker for existing library item */}
            {inLibrary && showFolderPicker && (
              <div ref={folderPickerRef} className="mt-2 bg-zinc-800 border border-zinc-600 rounded-xl shadow-xl py-1 min-w-[180px]">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Move to folder
                </div>
                <button
                  onClick={() => handleMoveToFolder(null)}
                  disabled={pendingAction !== null}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    !libraryItem?.folderId ? "text-primary-light" : "text-zinc-300"
                  }`}
                >
                  {pendingAction?.type === "move" && pendingAction.folderId === null ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  Uncategorized
                  {!libraryItem?.folderId && <span className="ml-auto text-xs">✓</span>}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    disabled={pendingAction !== null}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      libraryItem?.folderId === folder.id ? "text-primary-light" : "text-zinc-300"
                    }`}
                  >
                    {pendingAction?.type === "move" && pendingAction.folderId === folder.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    )}
                    {folder.name}
                    {libraryItem?.folderId === folder.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Folder picker when adding to library */}
            {showAddFolderPicker && !inLibrary && (
              <div ref={folderPickerRef} className="mt-2 bg-zinc-800 border border-zinc-600 rounded-xl shadow-xl py-1 min-w-[180px]">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Add to folder
                </div>
                <button
                  onClick={() => handleLibraryToggle(null)}
                  disabled={pendingAction !== null}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 text-zinc-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pendingAction?.type === "add" && pendingAction.folderId === null ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                  Uncategorized
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleLibraryToggle(folder.id)}
                    disabled={pendingAction !== null}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-700 text-zinc-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {pendingAction?.type === "add" && pendingAction.folderId === folder.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    )}
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
              {manga.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted">
              {manga.authors.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {manga.authors.join(", ")}
                </span>
              )}
              {manga.artists.length > 0 && manga.artists.join(", ") !== manga.authors.join(", ") && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                  </svg>
                  {manga.artists.join(", ")}
                </span>
              )}
            </div>

            {/* Status + Category + Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {manga.status && manga.status !== "unknown" && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border ${
                  statusColors[manga.status] || "bg-border text-zinc-300 border-border"
                }`}>
                  {manga.status.replace("_", " ")}
                </span>
              )}
              {manga.category && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-accent/10 text-accent border border-accent/20">
                  {manga.category}
                </span>
              )}
              {manga.genres.map((genre) => (
                <span key={genre} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary-light border border-primary/20">
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            {manga.description && (
              <p className="text-sm text-muted leading-relaxed mb-8 max-w-2xl">
                {manga.description}
              </p>
            )}

            {/* Chapter list / Page grid */}
            <div className="border-t border-border pt-6">
              {manga.pageThumbnails && manga.pageThumbnails.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                      Pages
                      <span className="text-muted font-normal text-sm ml-2">({manga.pageThumbnails.length})</span>
                    </h2>
                    <Link
                      href={`/read/${providerId}/${mangaId}/${mangaId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Read All
                    </Link>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto rounded-xl border border-border bg-bg-raised/50 p-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {manga.pageThumbnails.map((thumb, i) => (
                        <Link
                          key={i}
                          href={`/read/${providerId}/${mangaId}/${mangaId}?page=${i}`}
                          className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-bg-overlay border border-border hover:border-primary/40 transition-all duration-200 hover:scale-[1.03] hover:shadow-card-hover"
                        >
                          <img
                            src={thumb}
                            alt={`Page ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-semibold text-zinc-200 border border-white/10">
                            {i + 1}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : manga.pageCount ? (
                <div>
                  <h2 className="text-lg font-bold mb-4">
                    Pages
                    <span className="text-muted font-normal text-sm ml-2">({manga.pageCount})</span>
                  </h2>
                  <Link
                    href={`/read/${providerId}/${mangaId}/${mangaId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-glow hover:shadow-glow-lg"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Read ({manga.pageCount} pages)
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                      Chapters
                      <span className="text-muted font-normal text-sm ml-2">({chapters.length})</span>
                    </h2>
                    <div className="flex gap-1.5 bg-bg-overlay rounded-lg p-1 border border-border">
                      <button
                        onClick={() => setSortBy("chapter")}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                          sortBy === "chapter"
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-zinc-300"
                        }`}
                      >
                        By Chapter
                      </button>
                      <button
                        onClick={() => setSortBy("date")}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                          sortBy === "date"
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-zinc-300"
                        }`}
                      >
                        By Date
                      </button>
                    </div>
                  </div>

                  {chapters.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="h-12 w-12 mx-auto mb-3 text-primary/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <p className="text-muted text-sm">No chapters available</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[500px] overflow-y-auto rounded-xl border border-border bg-bg-raised/50">
                      {sortedChapters.map((chapter) => (
                        <Link
                          key={chapter.id}
                          href={`/read/${providerId}/${mangaId}/${chapter.id}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-bg-overlay/70 transition-all duration-150 group border-b border-border/50 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate transition-colors ${
                              readChapters.has(chapter.id)
                                ? "text-primary-light"
                                : "group-hover:text-primary-light"
                            }`}>
                              {chapter.number !== null
                                ? `Chapter ${chapter.number}`
                                : chapter.title}
                            </p>
                            {chapter.title && chapter.number !== null && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{chapter.title}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-4">
                            {chapter.scanlationGroup && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary-light border border-primary/20 hidden sm:block">
                                {chapter.scanlationGroup}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {chapter.uploadDate
                                ? new Date(chapter.uploadDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : ""}
                            </span>
                            <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary-light transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MangaDetailCover({ manga }: { manga: Manga }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = manga.cover ? ApiClient.imageUrl(manga.cover) : null;

  if (!imageUrl || imgError) {
    return <FallbackCover size="lg" />;
  }

  return (
    <img
      src={imageUrl}
      alt={manga.title}
      className="w-full h-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}
