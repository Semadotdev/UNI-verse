"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface PostLightboxProps {
  images: { url: string }[];
  index: number;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

export function PostLightbox({ images, index, onClose }: PostLightboxProps) {
  const [current, setCurrent] = useState(index);
  const [scale, setScale] = useState(1);

  const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  useEffect(() => {
    setScale(1);
  }, [current]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrent((c) => (images.length > 1 ? (c - 1 + images.length) % images.length : c));
      } else if (e.key === "ArrowRight") {
        setCurrent((c) => (images.length > 1 ? (c + 1) % images.length : c));
      } else if (e.key === "+" || e.key === "=") {
        setScale((s) => clamp(s + SCALE_STEP));
      } else if (e.key === "-") {
        setScale((s) => clamp(s - SCALE_STEP));
      } else if (e.key === "0") {
        setScale(1);
      }
    },
    [onClose, images.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const zoomIn = () => setScale((s) => clamp(s + SCALE_STEP));
  const zoomOut = () => setScale((s) => clamp(s - SCALE_STEP));
  const resetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-white/60 tabular-nums">
          {current + 1} / {images.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={resetZoom}
            disabled={scale === 1}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <span className="mx-1 text-xs text-white/40 tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto touch-pinch-zoom">
        <div className="min-h-full min-w-full flex items-center justify-center p-4">
          <img
            src={images[current].url}
            alt=""
            style={{ transform: `scale(${scale})` }}
            className="max-h-[calc(100vh-8rem)] w-auto max-w-full rounded-lg select-none"
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 border border-white/15 p-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 border border-white/15 p-2.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
