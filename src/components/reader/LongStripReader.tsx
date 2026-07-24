"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ApiClient } from "@/lib/api-client";
import type { Page } from "@/domain/entities/page";
import type { Settings } from "@/contexts/SettingsContext";

interface LongStripReaderProps {
  pages: Page[];
  settings: Settings;
  onPageChange?: (pageIndex: number) => void;
}

export function LongStripReader({ pages, settings, onPageChange }: LongStripReaderProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
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
        const imageUrl = page.direct ? page.url : ApiClient.imageUrl(page.url, page.headers);
        return (
          <div
            key={page.index}
            data-index={i}
            className="w-full"
            onClick={() => handleDoubleTap(i)}
          >
            <img
              src={imageUrl}
              alt={`Page ${i + 1}`}
              loading={i < settings.pagePreloadCount ? "eager" : "lazy"}
              className="w-full h-auto"
              style={{
                opacity: loaded[i] ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
                filter: `brightness(${settings.brightness})`,
                transform: zoomedPage === i ? "scale(1.5)" : undefined,
                transformOrigin: "top center",
              }}
              onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
            />
          </div>
        );
      })}
    </div>
  );
}
