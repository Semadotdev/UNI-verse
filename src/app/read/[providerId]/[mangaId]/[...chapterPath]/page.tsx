"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useReader } from "@/hooks/use-manga";
import { useSettings } from "@/contexts/SettingsContext";
import { useMangaSettings, mergeSettings } from "@/hooks/use-manga-settings";
import { LongStripReader } from "@/components/reader/LongStripReader";
import { PagedReader } from "@/components/reader/PagedReader";
import { ReaderSettingsDrawer } from "@/components/reader/ReaderSettingsDrawer";
import { Slider } from "@/components/ui/Slider";
import { useToast } from "@/contexts/ToastContext";
import { ApiClient } from "@/lib/api-client";
import type { Chapter } from "@/domain/entities/chapter";
import type { Manga } from "@/domain/entities/manga";

const SWIPE_HINT_KEY = "uni-verse-swipe-hint-shown";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const providerId = params.providerId as string;
  const mangaId = params.mangaId as string;
  const chapterId = (params.chapterPath as string[]).join("/");
  const { pages, loading, error, fetchPages } = useReader();
  const { settings: globalSettings } = useSettings();
  const { overrides, updateOverride, resetOverrides } = useMangaSettings(providerId, mangaId);
  const settings = mergeSettings(globalSettings, overrides);
  const [currentPage, setCurrentPage] = useState(0);
  const [toolbarsVisible, setToolbarsVisible] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [mangaDetails, setMangaDetails] = useState<Pick<Manga, "title" | "cover"> | null>(null);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);
  const [autoScrollActive, setAutoScrollActive] = useState(false);
  const [showChapterPrompt, setShowChapterPrompt] = useState(false);
  const toolbarTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeIndicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const autoScrollRafId = useRef<number>(0);
  const autoScrollActiveRef = useRef(false);
  const pausedByInteraction = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isLongStrip = settings.readingMode === "long-strip";

  useEffect(() => {
    fetchPages(providerId, chapterId);
  }, [providerId, chapterId, fetchPages]);

  useEffect(() => {
    ApiClient.get<Chapter[]>(`/api/manga/${providerId}/${mangaId}/chapters`)
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
        setChapters(sorted);
      })
      .catch(() => {});
  }, [providerId, mangaId]);

  useEffect(() => {
    ApiClient.get<Manga>(`/api/manga/${providerId}/${mangaId}`)
      .then((manga) => setMangaDetails({ title: manga.title, cover: manga.cover }))
      .catch(() => {});
  }, [providerId, mangaId]);

  const currentChapterIndex = chapters.findIndex((ch) => ch.id === chapterId);
  const currentChapter = currentChapterIndex >= 0 ? chapters[currentChapterIndex] : null;
  const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  // Record history when chapter loads
  useEffect(() => {
    if (!currentChapter || !mangaDetails) return;
    ApiClient.post("/api/history", {
      providerId,
      mangaId,
      chapterId,
      chapterNum: currentChapter.number,
      title: mangaDetails.title,
      coverUrl: mangaDetails.cover,
      progress: 0,
      completed: false,
    }).catch(() => {});
    ApiClient.post("/api/history/read", {
      providerId,
      mangaId,
      chapterId,
    }).catch(() => {});
  }, [providerId, mangaId, chapterId, currentChapter, mangaDetails]);

  // Update progress on page change (debounced)
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentChapter || !mangaDetails || pages.length === 0) return;
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      const progress = ((currentPage + 1) / pages.length) * 100;
      const completed = currentPage >= pages.length - 1;
      ApiClient.post<{ rewarded?: boolean }>("/api/history", {
        providerId,
        mangaId,
        chapterId,
        chapterNum: currentChapter.number,
        title: mangaDetails.title,
        coverUrl: mangaDetails.cover,
        progress,
        completed,
      })
        .then((res) => {
          if (res.rewarded) addToast("You earned a coin!", "success");
        })
        .catch(() => {});
    }, 2000);
    return () => { if (progressTimer.current) clearTimeout(progressTimer.current); };
  }, [currentPage, pages.length, currentChapter, mangaDetails, providerId, mangaId, chapterId]);

  const showToolbars = useCallback(() => {
    setToolbarsVisible(true);
    if (toolbarTimeout.current) clearTimeout(toolbarTimeout.current);
    toolbarTimeout.current = setTimeout(() => setToolbarsVisible(false), 3000);
  }, []);

  useEffect(() => {
    toolbarTimeout.current = setTimeout(() => setToolbarsVisible(false), 3000);
    return () => { if (toolbarTimeout.current) clearTimeout(toolbarTimeout.current); };
  }, []);

  // Show a one-time swipe hint on the first chapter read (mobile only)
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    if (localStorage.getItem(SWIPE_HINT_KEY)) return;
    if (loading || pages.length === 0) return;

    setShowSwipeIndicator(true);
    localStorage.setItem(SWIPE_HINT_KEY, "1");
    if (swipeIndicatorTimeout.current) clearTimeout(swipeIndicatorTimeout.current);
    swipeIndicatorTimeout.current = setTimeout(() => setShowSwipeIndicator(false), 3000);

    return () => { if (swipeIndicatorTimeout.current) clearTimeout(swipeIndicatorTimeout.current); };
  }, [isLongStrip, loading, pages.length]);

  // Dismiss the hint on first touch
  useEffect(() => {
    if (!showSwipeIndicator) return;
    const dismiss = () => setShowSwipeIndicator(false);
    window.addEventListener("touchstart", dismiss, { once: true, passive: true });
    return () => window.removeEventListener("touchstart", dismiss);
  }, [showSwipeIndicator]);

  // Reset auto-scroll when chapter changes
  useEffect(() => {
    setAutoScrollActive(false);
    autoScrollActiveRef.current = false;
    setShowChapterPrompt(false);
    pausedByInteraction.current = false;
    if (autoScrollRafId.current) cancelAnimationFrame(autoScrollRafId.current);
  }, [chapterId]);

  // Auto-scroll engine
  useEffect(() => {
    if (!autoScrollActive || !isLongStrip) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTime = 0;

    const tick = (time: number) => {
      if (!autoScrollActiveRef.current) return;
      if (pausedByInteraction.current) return;

      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      const speed = settings.autoScrollSpeed * 0.5;
      container.scrollBy(0, speed * (delta / 16.67));

      // Check if we've reached the bottom
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;
      const atLastPage = currentPage >= pages.length - 1;

      if (atBottom && atLastPage) {
        autoScrollActiveRef.current = false;
        setAutoScrollActive(false);
        if (nextChapter) {
          setShowChapterPrompt(true);
        }
        return;
      }

      autoScrollRafId.current = requestAnimationFrame(tick);
    };

    pausedByInteraction.current = false;
    autoScrollRafId.current = requestAnimationFrame(tick);

    return () => {
      if (autoScrollRafId.current) cancelAnimationFrame(autoScrollRafId.current);
    };
  }, [autoScrollActive, isLongStrip, settings.autoScrollSpeed, currentPage, pages.length, nextChapter]);

  // Pause auto-scroll on user interaction
  useEffect(() => {
    if (!autoScrollActive) return;

    const pause = (e: Event) => {
      if (!autoScrollActiveRef.current) return;
      if (e instanceof TouchEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-auto-scroll-btn]")) return;
      }
      pausedByInteraction.current = true;
      setAutoScrollActive(false);
      autoScrollActiveRef.current = false;
      if (autoScrollRafId.current) cancelAnimationFrame(autoScrollRafId.current);
    };

    window.addEventListener("touchstart", pause, { once: true, passive: true });
    window.addEventListener("mousedown", pause, { once: true });
    window.addEventListener("keydown", pause, { once: true });

    return () => {
      window.removeEventListener("touchstart", pause);
      window.removeEventListener("mousedown", pause);
      window.removeEventListener("keydown", pause);
    };
  }, [autoScrollActive]);

  const goToPage = useCallback(
    (pageIndex: number) => {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        setCurrentPage(pageIndex);
        if (isLongStrip) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    },
    [pages.length, isLongStrip]
  );

  const goToChapter = useCallback(
    (chapter: Chapter) => {
      router.push(`/read/${providerId}/${mangaId}/${chapter.id}`);
    },
    [router, providerId, mangaId]
  );

  const handleTap = useCallback(() => {
    if (drawerOpen) return;
    if (toolbarsVisible) {
      setToolbarsVisible(false);
    } else {
      showToolbars();
    }
  }, [toolbarsVisible, showToolbars, drawerOpen]);

  // Swipe gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only trigger if horizontal swipe > 50px and more horizontal than vertical
    if (absDx < 50 || absDx < absDy * 1.2) return;

    const isRTL = settings.readingMode === "paged-rtl";
    const swipeLeft = dx < 0;
    const goNext = isRTL ? !swipeLeft : swipeLeft;

    if (isLongStrip) {
      // Long-strip: swipe navigates chapters
      if (goNext) {
        if (nextChapter) goToChapter(nextChapter);
      } else {
        if (prevChapter) goToChapter(prevChapter);
      }
    } else {
      // Paged: swipe navigates pages
      if (goNext) {
        if (currentPage < pages.length - 1) {
          goToPage(currentPage + 1);
        } else if (nextChapter) {
          goToChapter(nextChapter);
        }
      } else {
        if (currentPage > 0) {
          goToPage(currentPage - 1);
        } else if (prevChapter) {
          goToChapter(prevChapter);
        }
      }
    }
  }, [isLongStrip, settings.readingMode, currentPage, pages.length, nextChapter, prevChapter, goToPage, goToChapter]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-bg">
        <div className="text-center">
          <svg className="h-12 w-12 mx-auto mb-4 text-primary/30 animate-pulse-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <p className="text-muted text-sm">Loading pages...</p>
        </div>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-bg">
        <div className="text-center px-4">
          <svg className="h-16 w-16 mx-auto mb-4 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <p className="text-lg font-semibold mb-2 text-zinc-300">Failed to load chapter</p>
          <p className="text-sm text-muted mb-6">{error || "No pages available"}</p>
          <Link href={`/manga/${providerId}/${mangaId}`} className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            Back to Manga
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((currentPage + 1) / pages.length) * 100;
  const chapterLabel = currentChapter
    ? (currentChapter.title || `Ch. ${currentChapter.number}`)
    : null;

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col"
      style={{ backgroundColor: settings.backgroundColor }}
      onClick={handleTap}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-black/30">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-bg-raised/95 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between transition-all duration-300 ${
          toolbarsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/manga/${providerId}/${mangaId}`}
          className="text-muted hover:text-zinc-100 transition-colors shrink-0"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <div className="flex items-center gap-1.5 text-sm text-muted font-medium min-w-0 mx-3">
          {chapterLabel && (
            <>
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{chapterLabel}</span>
              <span className="text-zinc-600 shrink-0">—</span>
            </>
          )}
          <span className="shrink-0">{currentPage + 1} / {pages.length}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDrawerOpen(true);
          }}
          className="text-muted hover:text-zinc-100 transition-colors shrink-0"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Reader content — swipe handler */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-hidden ${isLongStrip ? "overflow-y-auto pt-10 pb-4" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLongStrip ? (
          <LongStripReader pages={pages} settings={settings} onPageChange={goToPage} />
        ) : (
          <PagedReader
            key={currentPage}
            pages={pages}
            settings={settings}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-bg-raised/95 backdrop-blur-md border-t border-border px-4 py-3 transition-all duration-300 ${
          toolbarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {isLongStrip ? (
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {prevChapter ? (
              <button
                onClick={() => goToChapter(prevChapter)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="truncate max-w-[120px]">{prevChapter.title || `Ch. ${prevChapter.number}`}</span>
              </button>
            ) : <div />}
            {nextChapter ? (
              <button
                onClick={() => goToChapter(nextChapter)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-zinc-100 transition-colors"
              >
                <span className="truncate max-w-[120px]">{nextChapter.title || `Ch. ${nextChapter.number}`}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : <div />}
          </div>
        ) : (
          <div className="hidden md:flex items-center justify-between max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 text-muted hover:text-primary-light disabled:opacity-30 transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <Slider
              min={0}
              max={pages.length - 1}
              value={currentPage}
              onChange={(v) => goToPage(v)}
              label="Page navigation"
              className="flex-1 mx-4"
            />
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pages.length - 1}
              className="p-2 text-muted hover:text-primary-light disabled:opacity-30 transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Swipe indicator — one-time mobile hint */}
      {showSwipeIndicator && (
        <div className="md:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 animate-fade-in pointer-events-none">
          <ChevronLeft className="h-4 w-4 text-white/50" />
          <span className="text-xs text-white/60 font-medium tracking-wide whitespace-nowrap">
            {isLongStrip ? "Swipe for next / prev chapter" : "Swipe to turn pages"}
          </span>
          <ChevronRight className="h-4 w-4 text-white/50" />
        </div>
      )}

      {/* Floating settings FAB */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDrawerOpen(true);
        }}
        className={`hidden md:flex fixed bottom-6 right-6 z-50 h-11 w-11 items-center justify-center rounded-full bg-bg-raised/90 border border-border shadow-lg hover:bg-bg-overlay hover:border-primary transition-all duration-300 ${
          toolbarsVisible || autoScrollActive ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Settings className="h-5 w-5 text-muted hover:text-zinc-200" />
      </button>

      {/* Floating auto-scroll FAB — long-strip only */}
      {isLongStrip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (autoScrollActiveRef.current) {
              autoScrollActiveRef.current = false;
              setAutoScrollActive(false);
              if (autoScrollRafId.current) cancelAnimationFrame(autoScrollRafId.current);
            } else {
              setShowChapterPrompt(false);
              autoScrollActiveRef.current = true;
              setAutoScrollActive(true);
            }
          }}
          className={`fixed bottom-[4.5rem] right-6 md:bottom-6 md:right-20 z-50 h-11 w-11 flex items-center justify-center rounded-full bg-bg-raised/90 border shadow-lg backdrop-blur-md transition-all duration-300 ${
            autoScrollActive
              ? "border-primary text-primary hover:bg-bg-overlay"
              : "border-border text-muted hover:border-primary hover:text-zinc-200 hover:bg-bg-overlay"
          } ${toolbarsVisible ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          title={autoScrollActive ? "Stop auto-scroll" : "Start auto-scroll"}
          data-auto-scroll-btn
        >
          {autoScrollActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      )}

      {/* Chapter prompt modal */}
      {showChapterPrompt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-bg-raised border border-border rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <p className="text-zinc-200 text-sm font-medium mb-1">End of chapter</p>
            <p className="text-muted text-xs mb-5">
              You&apos;ve reached the last page. Continue to the next chapter?
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChapterPrompt(false);
                }}
                className="flex-1 py-2.5 text-xs font-medium text-muted border border-border rounded-lg hover:border-border-hover hover:text-zinc-200 transition-colors"
              >
                Stay
              </button>
              {nextChapter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChapterPrompt(false);
                    goToChapter(nextChapter);
                  }}
                  className="flex-1 py-2.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors"
                >
                  Next Chapter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating prev/next arrows — desktop only for paged, all sizes for long-strip */}
      {isLongStrip ? (
        <>
          {prevChapter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToChapter(prevChapter);
              }}
              className={`hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 items-center justify-center rounded-full bg-bg-raised/80 border border-border hover:border-primary shadow-lg backdrop-blur-md transition-all duration-300 text-muted hover:text-zinc-200 ${
                (toolbarsVisible || autoScrollActive) ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              title="Previous chapter"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {nextChapter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToChapter(nextChapter);
              }}
              className={`hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 items-center justify-center rounded-full bg-bg-raised/80 border border-border hover:border-primary shadow-lg backdrop-blur-md transition-all duration-300 text-muted hover:text-zinc-200 ${
                (toolbarsVisible || autoScrollActive) ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              title="Next chapter"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </>
      ) : (
        <>
          {currentPage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPage(currentPage - 1);
              }}
              className={`hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 items-center justify-center rounded-full bg-bg-raised/80 border border-border hover:border-primary shadow-lg backdrop-blur-md transition-all duration-300 text-muted hover:text-zinc-200 ${
                toolbarsVisible ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              title="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentPage < pages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPage(currentPage + 1);
              }}
              className={`hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 items-center justify-center rounded-full bg-bg-raised/80 border border-border hover:border-primary shadow-lg backdrop-blur-md transition-all duration-300 text-muted hover:text-zinc-200 ${
                toolbarsVisible ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              title="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </>
      )}

      {/* Settings drawer */}
      <ReaderSettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        onUpdateOverride={updateOverride}
        onResetOverrides={resetOverrides}
        hasOverrides={Object.keys(overrides).length > 0}
      />
    </div>
  );
}
