"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { buildPageImageUrl } from "@/lib/reader-page-image";
import type { Page } from "@/domain/entities/page";
import type { Settings } from "@/contexts/SettingsContext";

interface LongStripReaderProps {
  pages: Page[];
  settings: Settings;
  onPageChange?: (pageIndex: number) => void;
}

export function LongStripReader({ pages, settings, onPageChange }: LongStripReaderProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
  const [zoomedPage, setZoomedPage] = useState<number | null>(null);
  const lastTap = useRef(0);
  const intersectingRef = useRef<Map<Element, number>>(new Map());
  const currentPageRef = useRef(-1);

  const handleDoubleTap = useCallback((pageIndex: number) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoomedPage((prev) => (prev === pageIndex ? null : pageIndex));
    }
    lastTap.current = now;
  }, []);

  // Preload observer — lazy loads images with large rootMargin
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-index") || "0");
            setLoaded((prev) => ({ ...prev, [idx]: true }));
          }
        });
      },
      { rootMargin: `${settings.pagePreloadCount * 800}px` }
    );

    const items = document.querySelectorAll("[data-index]");
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages.length, settings.pagePreloadCount]);

  // Current page tracking observer
  useEffect(() => {
    if (!onPageChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Update the map of intersecting elements
        entries.forEach((entry) => {
          const idx = parseInt(entry.target.getAttribute("data-index") || "0");
          if (entry.isIntersecting) {
            intersectingRef.current.set(entry.target, idx);
          } else {
            intersectingRef.current.delete(entry.target);
          }
        });

        // Find the most visible entry (highest intersectionRatio)
        let bestIdx = -1;
        let bestRatio = -1;
        intersectingRef.current.forEach((idx, el) => {
          const entry = (observer as unknown as { takeRecords(): IntersectionObserverEntry[] }).takeRecords().find((r) => r.target === el);
          const ratio = entry?.intersectionRatio ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        });

        if (bestIdx >= 0 && bestIdx !== currentPageRef.current) {
          currentPageRef.current = bestIdx;
          onPageChange(bestIdx);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const items = document.querySelectorAll("[data-index]");
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages.length, onPageChange]);

  return (
    <div
      className="w-full max-w-3xl mx-auto"
      style={{
        paddingLeft: settings.sidePadding,
        paddingRight: settings.sidePadding,
      }}
    >
      {pages.map((page, i) => {
        const retryCount = retryCounts[i] ?? 0;
        const imageUrl = buildPageImageUrl(page, retryCount);
        return (
          <div
            key={page.index}
            data-index={i}
            className="w-full relative"
            onClick={() => handleDoubleTap(i)}
          >
            <img
              src={imageUrl}
              alt={`Page ${i + 1}`}
              loading={i < settings.pagePreloadCount ? "eager" : "lazy"}
              className={failed[i] ? "hidden" : "w-full h-auto"}
              style={failed[i] ? undefined : {
                opacity: loaded[i] ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
                filter: `brightness(${settings.brightness})`,
                transform: zoomedPage === i ? "scale(1.5)" : undefined,
                transformOrigin: "top center",
              }}
              onLoad={() => {
                setLoaded((prev) => ({ ...prev, [i]: true }));
                setFailed((prev) => ({ ...prev, [i]: false }));
              }}
              onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
            />
            {failed[i] && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
                <p className="text-sm text-muted mb-4">Failed to load page {i + 1}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFailed((prev) => ({ ...prev, [i]: false }));
                    setLoaded((prev) => ({ ...prev, [i]: false }));
                    setRetryCounts((prev) => ({ ...prev, [i]: (prev[i] ?? 0) + 1 }));
                  }}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
