"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ApiClient } from "@/lib/api-client";
import type { Page } from "@/domain/entities/page";
import type { Settings } from "@/contexts/SettingsContext";

interface PagedReaderProps {
  pages: Page[];
  settings: Settings;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PagedReader({ pages, settings, currentPage, onPageChange }: PagedReaderProps) {
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const zoomedRef = useRef(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const isRTL = settings.readingMode === "paged-rtl";
  const isVertical = settings.readingMode === "paged-vertical";

  const resetZoom = useCallback(() => {
    zoomedRef.current = false;
    setZoomed(false);
    setZoomOffset({ x: 0, y: 0 });
  }, []);

  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (zoomedRef.current) {
        resetZoom();
      } else {
        zoomedRef.current = true;
        setZoomed(true);
        const rect = imgRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * -100;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * -100;
          setZoomOffset({ x, y });
        }
      }
    }
    lastTap.current = now;
  }, [resetZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVertical) {
        if (e.key === "ArrowUp") onPageChange(currentPage - 1);
        if (e.key === "ArrowDown") onPageChange(currentPage + 1);
      } else if (isRTL) {
        if (e.key === "ArrowRight") onPageChange(currentPage - 1);
        if (e.key === "ArrowLeft") onPageChange(currentPage + 1);
      } else {
        if (e.key === "ArrowLeft") onPageChange(currentPage - 1);
        if (e.key === "ArrowRight") onPageChange(currentPage + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, isRTL, isVertical, onPageChange]);

  useEffect(() => {
    if (!settings.doubleTapZoom) return;
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length > 0) return;
      const now = Date.now();
      if (now - lastTap.current < 300) {
        e.preventDefault();
        if (zoomedRef.current) {
          resetZoom();
        } else {
          zoomedRef.current = true;
          setZoomed(true);
          const touch = e.changedTouches[0];
          const rect = imgRef.current?.getBoundingClientRect();
          if (rect) {
            const x = ((touch.clientX - rect.left) / rect.width - 0.5) * -100;
            const y = ((touch.clientY - rect.top) / rect.height - 0.5) * -100;
            setZoomOffset({ x, y });
          }
        }
      }
      lastTap.current = now;
    };
    window.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => window.removeEventListener("touchend", handleTouchEnd);
  }, [settings.doubleTapZoom, resetZoom]);

  if (pages.length === 0) return null;

  const page = pages[currentPage];
  const imageUrl = ApiClient.imageUrl(page.url, page.headers);

  const scaleX = settings.scaleType === "fit-width" ? "w-full h-auto" : "h-[calc(100vh-8rem)] w-auto";
  const scaleY = settings.scaleType === "contain" ? "max-h-[calc(100vh-8rem)] w-auto" : "";

  return (
    <div
      className="flex items-center justify-center w-full h-full relative"
      style={{
        paddingLeft: settings.sidePadding,
        paddingRight: settings.sidePadding,
      }}
    >
      <img
        ref={imgRef}
        key={currentPage}
        src={imageUrl}
        alt={`Page ${currentPage + 1}`}
        className={`mx-auto transition-transform duration-200 ${scaleX} ${scaleY}`}
        onLoad={() => setImageLoaded((prev) => ({ ...prev, [currentPage]: true }))}
        onClick={settings.doubleTapZoom ? handleDoubleTap : undefined}
        style={{
          opacity: imageLoaded[currentPage] ? 1 : 0,
          transition: "opacity 0.3s ease-in-out, transform 0.2s ease-out",
          filter: `brightness(${settings.brightness})`,
          transform: zoomed ? `scale(2) translate(${zoomOffset.x}%, ${zoomOffset.y}%)` : undefined,
          objectFit: settings.cropBorders ? "contain" : undefined,
        }}
      />
      {settings.showPageNumber && (
        <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
          {currentPage + 1} / {pages.length}
        </div>
      )}
    </div>
  );
}
