"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { buildPageImageUrl } from "@/lib/reader-page-image";
import { clusterPageComments } from "@/lib/pin-clustering";
import type { Page } from "@/domain/entities/page";
import type { Settings } from "@/contexts/SettingsContext";
import type { PageComment } from "@/domain/entities/page-comment";
import { PageCommentPin } from "@/components/reader/PageCommentPin";
import { PageCommentPopover } from "@/components/reader/PageCommentPopover";
import { PageCommentComposer } from "@/components/reader/PageCommentComposer";

interface Viewer {
  avatarUrl: string | null;
  username: string | null;
  name: string | null;
}

interface LongStripReaderProps {
  pages: Page[];
  settings: Settings;
  onPageChange?: (pageIndex: number) => void;
  providerId?: string;
  mangaId?: string;
  chapterId?: string;
  comments?: PageComment[];
  viewer?: Viewer | null;
  onCommentCreated?: (comment: PageComment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export function LongStripReader({
  pages,
  settings,
  onPageChange,
  providerId,
  mangaId,
  chapterId,
  comments = [],
  viewer = null,
  onCommentCreated,
  onCommentDeleted,
}: LongStripReaderProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
  const [zoomedPage, setZoomedPage] = useState<number | null>(null);
  const [activePin, setActivePin] = useState<{ pageIndex: number; pageY: number } | null>(null);
  const [pendingPin, setPendingPin] = useState<{ pageIndex: number; pageY: number } | null>(null);
  const lastTap = useRef(0);
  const longPressRef = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const intersectingRef = useRef<Map<Element, number>>(new Map());
  const currentPageRef = useRef(-1);

  const commentable = Boolean(providerId && mangaId && chapterId);
  const clusters = useMemo(() => clusterPageComments(comments), [comments]);
  const clustersByPage = useMemo(() => {
    const byPage = new Map<number, typeof clusters>();
    for (const c of clusters) {
      const list = byPage.get(c.pageIndex) ?? [];
      list.push(c);
      byPage.set(c.pageIndex, list);
    }
    return byPage;
  }, [clusters]);

  const activeCluster = useMemo(() => {
    if (!activePin) return null;
    const list = clustersByPage.get(activePin.pageIndex) ?? [];
    return (
      list.find((c) => Math.abs(c.pageY - activePin.pageY) <= 0.05) ?? null
    );
  }, [clustersByPage, activePin]);

  const handleDoubleTap = useCallback((pageIndex: number) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoomedPage((prev) => (prev === pageIndex ? null : pageIndex));
    }
    lastTap.current = now;
  }, []);

  const beginLongPress = useCallback(
    (e: React.PointerEvent, pageIndex: number) => {
      if (!commentable) return;
      const el = e.currentTarget as HTMLElement;
      const startX = e.clientX;
      const startY = e.clientY;
      longPressRef.current = {
        x: startX,
        y: startY,
        timer: setTimeout(() => {
          const rect = el.getBoundingClientRect();
          if (rect.height === 0) return;
          const pageY = Math.min(Math.max((startY - rect.top) / rect.height, 0), 1);
          setPendingPin({ pageIndex, pageY });
        }, 500),
      };
    },
    [commentable]
  );

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current.timer);
      longPressRef.current = null;
    }
  }, []);

  const moveLongPress = useCallback(
    (e: React.PointerEvent) => {
      const press = longPressRef.current;
      if (!press) return;
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) {
        cancelLongPress();
      }
    },
    [cancelLongPress]
  );

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
        entries.forEach((entry) => {
          const idx = parseInt(entry.target.getAttribute("data-index") || "0");
          if (entry.isIntersecting) {
            intersectingRef.current.set(entry.target, idx);
          } else {
            intersectingRef.current.delete(entry.target);
          }
        });

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
        const pageClusters = clustersByPage.get(i) ?? [];
        return (
          <div
            key={page.index}
            data-index={i}
            className="w-full relative"
            onClick={() => handleDoubleTap(i)}
            onPointerDown={(e) => beginLongPress(e, i)}
            onPointerMove={moveLongPress}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
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
            {zoomedPage !== i &&
              pageClusters.map((cluster) => (
                <PageCommentPin
                  key={`${cluster.pageY}-${cluster.comments[0].id}`}
                  count={cluster.comments.length}
                  pageY={cluster.pageY}
                  onClick={() => setActivePin({ pageIndex: i, pageY: cluster.pageY })}
                />
              ))}
            {zoomedPage !== i && activeCluster && activeCluster.pageIndex === i && (
              <PageCommentPopover
                comments={activeCluster.comments}
                viewer={viewer}
                providerId={providerId!}
                mangaId={mangaId!}
                chapterId={chapterId!}
                pageIndex={i}
                pageY={activeCluster.pageY}
                onClose={() => setActivePin(null)}
                onCreated={(comment) => {
                  onCommentCreated?.(comment);
                  setActivePin({ pageIndex: i, pageY: comment.pageY });
                }}
                onDeleted={onCommentDeleted ?? (() => {})}
              />
            )}
          </div>
        );
      })}
      {pendingPin && providerId && mangaId && chapterId && (
        <PageCommentComposer
          providerId={providerId}
          mangaId={mangaId}
          chapterId={chapterId}
          pageIndex={pendingPin.pageIndex}
          pageY={pendingPin.pageY}
          viewer={viewer}
          onClose={() => setPendingPin(null)}
          onCreated={onCommentCreated ?? (() => {})}
        />
      )}
    </div>
  );
}
