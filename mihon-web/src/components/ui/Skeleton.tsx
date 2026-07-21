"use client";

import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "circle" | "rectangle" | "card";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  /** Number of text lines (only for "text" variant) */
  lines?: number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded",
  circle: "rounded-full",
  rectangle: "rounded-lg",
  card: "rounded-lg",
};

export function Skeleton({ variant = "rectangle", className, lines = 1 }: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse bg-zinc-800",
              variantClasses.text,
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-800",
        variantClasses[variant],
        className
      )}
    />
  );
}

/** Pre-built skeleton that mimics a manga card in a grid. */
export function MangaCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900", className)}>
      <Skeleton variant="rectangle" className="aspect-[2/3] w-full rounded-none" />
      <div className="p-2 space-y-2">
        <Skeleton variant="text" className="h-3" />
        <Skeleton variant="text" className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}

/** Pre-built skeleton grid that mimics MangaGrid. */
export function MangaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Pre-built skeleton for a list row. */
export function ListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3",
        className
      )}
    >
      <Skeleton variant="rectangle" className="h-20 w-14 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-3.5 w-2/3" />
        <Skeleton variant="text" className="h-2.5 w-1/4" />
        <Skeleton variant="text" className="h-1.5 w-1/2" />
      </div>
    </div>
  );
}
