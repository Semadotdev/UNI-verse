"use client";

import { useEffect, useRef } from "react";

interface WebtoonReaderProps {
  pages: string[];
  onProgress?: (progress: number) => void;
}

export function WebtoonReader({ pages, onProgress }: WebtoonReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollTop / (scrollHeight - clientHeight);
      onProgress?.(Math.min(1, Math.max(0, progress)));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onProgress]);

  if (pages.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        No pages available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[80vh] overflow-y-auto">
      <div className="mx-auto max-w-3xl">
        {pages.map((page, index) => (
          <img
            key={index}
            src={`/api/image?url=${encodeURIComponent(page)}`}
            alt={`Page ${index + 1}`}
            className="w-full"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}
