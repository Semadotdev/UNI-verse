"use client";

import { cn } from "@/lib/utils";

export type SortOption = "recently_added" | "title" | "last_read";
export type ViewMode = "grid" | "list";

interface LibraryFiltersProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recently_added", label: "Recently Added" },
  { value: "title", label: "Title A-Z" },
  { value: "last_read", label: "Last Read" },
];

export function LibraryFilters({
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: LibraryFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label htmlFor="sort-select" className="text-sm text-zinc-400">
          Sort by:
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={cn(
            "h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "cursor-pointer"
          )}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-800 p-0.5">
        <button
          onClick={() => onViewModeChange("grid")}
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-md transition-colors",
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "text-zinc-400 hover:text-zinc-100"
          )}
          aria-label="Grid view"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-md transition-colors",
            viewMode === "list"
              ? "bg-primary text-primary-foreground"
              : "text-zinc-400 hover:text-zinc-100"
          )}
          aria-label="List view"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
