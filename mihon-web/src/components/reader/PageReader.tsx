"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PageReaderProps {
  pages: string[];
  direction?: "ltr" | "rtl";
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export function PageReader({
  pages,
  direction = "rtl",
  initialPage = 0,
  onPageChange,
}: PageReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  const goNext = () => {
    if (direction === "rtl") {
      setCurrentPage((p) => Math.max(0, p - 1));
    } else {
      setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
    }
  };

  const goPrev = () => {
    if (direction === "rtl") {
      setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
    } else {
      setCurrentPage((p) => Math.max(0, p - 1));
    }
  };

  if (pages.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-500">
        No pages available
      </div>
    );
  }

  return (
    <div className="relative flex h-[80vh] items-center justify-center">
      <img
        src={`/api/image?url=${encodeURIComponent(pages[currentPage])}`}
        alt={`Page ${currentPage + 1}`}
        className="max-h-full max-w-full object-contain"
      />
      <button
        onClick={goNext}
        className="absolute left-0 top-0 h-full w-1/3 opacity-0 hover:opacity-100"
        aria-label="Previous page"
      />
      <button
        onClick={goPrev}
        className="absolute right-0 top-0 h-full w-1/3 opacity-0 hover:opacity-100"
        aria-label="Next page"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        {currentPage + 1} / {pages.length}
      </div>
    </div>
  );
}
