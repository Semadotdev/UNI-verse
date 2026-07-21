"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageReader } from "@/components/reader/PageReader";
import { WebtoonReader } from "@/components/reader/WebtoonReader";
import { ReaderControls } from "@/components/reader/ReaderControls";
import { ReaderSettings } from "@/components/reader/ReaderSettings";
import { TouchHandler } from "@/components/reader/TouchHandler";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ChevronRight } from "lucide-react";

const STORAGE_KEY_PREFIX = "mihon-reader-position";

interface SavedPosition {
  chapterId: string;
  page: number;
  timestamp: number;
}

export default function ReadPage() {
  const params = useParams();
  const sourceId = params.sourceId as string;
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerMode, setReaderMode] = useState<"page" | "webtoon">("page");
  const [direction, setDirection] = useState<"ltr" | "rtl">("rtl");
  const [brightness, setBrightness] = useState(1.0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [padding, setPadding] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [savedPosition, setSavedPosition] = useState<SavedPosition | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Load pages
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pages/${sourceId}/${chapterId}`);
        const data = await res.json();
        setPages(data);
      } catch (error) {
        console.error("Failed to load pages:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sourceId, chapterId]);

  // Check for saved position on load
  useEffect(() => {
    if (pages.length === 0) return;

    const storageKey = `${STORAGE_KEY_PREFIX}-${mangaId}-${chapterId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SavedPosition = JSON.parse(saved);
        // Only offer resume if saved within last 7 days and not at the start
        const daysSinceSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceSave < 7 && parsed.page > 0 && parsed.page < pages.length) {
          setSavedPosition(parsed);
          setShowResumePrompt(true);
        }
      } catch {
        // Ignore invalid saved data
      }
    }
  }, [pages, mangaId, chapterId]);

  // Save position on page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);

      // Save to localStorage
      const storageKey = `${STORAGE_KEY_PREFIX}-${mangaId}-${chapterId}`;
      const position: SavedPosition = {
        chapterId,
        page,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(position));

      // Track reading progress to API
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaId,
          sourceId,
          chapterId,
          progress: page / Math.max(1, pages.length - 1),
        }),
      }).catch(console.error);
    },
    [mangaId, sourceId, chapterId, pages.length]
  );

  // Resume from saved position
  const handleResume = useCallback(() => {
    if (savedPosition) {
      setCurrentPage(savedPosition.page);
      setShowResumePrompt(false);
    }
  }, [savedPosition]);

  // Dismiss resume prompt
  const handleDismissResume = useCallback(() => {
    setShowResumePrompt(false);
  }, []);

  // Touch gesture handlers for page mode
  const handleSwipeLeft = useCallback(() => {
    if (readerMode === "page") {
      if (direction === "rtl") {
        setCurrentPage((p) => Math.max(0, p - 1));
      } else {
        setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
      }
    }
  }, [readerMode, direction, pages.length]);

  const handleSwipeRight = useCallback(() => {
    if (readerMode === "page") {
      if (direction === "rtl") {
        setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
      } else {
        setCurrentPage((p) => Math.max(0, p - 1));
      }
    }
  }, [readerMode, direction, pages.length]);

  const handleSwipeUp = useCallback(() => {
    setReaderMode("webtoon");
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-7xl px-4 transition-colors duration-300"
      style={{
        filter: `brightness(${brightness})`,
        backgroundColor: bgColor,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/manga/${sourceId}/${mangaId}`}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <ReaderControls
          direction={direction}
          onDirectionChange={setDirection}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>

      {/* Resume Prompt */}
      {showResumePrompt && savedPosition && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/80 p-3">
          <span className="text-sm text-zinc-300">
            Resume from page {savedPosition.page + 1}?
          </span>
          <Button size="sm" onClick={handleResume}>
            <ChevronRight className="mr-1 h-3 w-3" />
            Resume
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismissResume}>
            Start from beginning
          </Button>
        </div>
      )}

      <TouchHandler
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        enabled={readerMode === "page"}
        className="rounded-lg"
      >
        <div style={{ padding: `${padding}px` }}>
          {readerMode === "page" ? (
            <PageReader
              pages={pages}
              direction={direction}
              initialPage={currentPage}
              onPageChange={handlePageChange}
            />
          ) : (
            <WebtoonReader pages={pages} onProgress={(p) => {
              const page = Math.round(p * (pages.length - 1));
              handlePageChange(page);
            }} />
          )}
        </div>
      </TouchHandler>

      {/* Preloader - hidden images for next 3 pages */}
      <div className="sr-only" aria-hidden="true">
        {pages.slice(currentPage + 1, currentPage + 4).map((page, index) => (
          <img
            key={`preload-${currentPage + 1 + index}`}
            src={`/api/image?url=${encodeURIComponent(page)}`}
            alt=""
            loading="eager"
          />
        ))}
      </div>

      {/* Loading indicator for current page */}
      {readerMode === "page" && pages.length > 0 && (
        <PageLoadingIndicator
          src={`/api/image?url=${encodeURIComponent(pages[currentPage])}`}
        />
      )}

      {/* Settings Panel */}
      <ReaderSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={readerMode}
        direction={direction}
        brightness={brightness}
        bgColor={bgColor}
        padding={padding}
        onModeChange={setReaderMode}
        onDirectionChange={setDirection}
        onBrightnessChange={setBrightness}
        onBgColorChange={setBgColor}
        onPaddingChange={setPadding}
      />
    </div>
  );
}

// Component to track when the current page image is loaded
function PageLoadingIndicator({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = src;
  }, [src]);

  if (loaded) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
      <Spinner size="sm" className="mr-2 inline-block" />
      Loading...
    </div>
  );
}
