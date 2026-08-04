"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearch } from "@/hooks/use-manga";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Combobox } from "@/components/ui/Combobox";
import { WebtoonsNotice } from "@/components/ui/WebtoonsNotice";
import { useProvider } from "@/contexts/ProviderContext";

const MANHWA18_GENRES = [
  { label: "Action", value: "action" },
  { label: "Adult", value: "adult" },
  { label: "Adventure", value: "adventure" },
  { label: "BL", value: "bl" },
  { label: "Comedy", value: "comedy" },
  { label: "Comics", value: "comics" },
  { label: "Doujinshi", value: "doujinshi" },
  { label: "Drama", value: "drama" },
  { label: "Ecchi", value: "ecchi" },
  { label: "Family", value: "family" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Gender Bender", value: "gender-bender" },
  { label: "GL", value: "gl" },
  { label: "Harem", value: "harem" },
  { label: "Hentai", value: "hentai" },
  { label: "Historical", value: "historical" },
  { label: "Horror", value: "horror" },
  { label: "Isekai", value: "isekai" },
  { label: "Josei", value: "josei" },
  { label: "Magic", value: "magic" },
  { label: "Martial Arts", value: "martial-arts" },
  { label: "Mature", value: "mature" },
  { label: "Mecha", value: "mecha" },
  { label: "Mystery", value: "mystery" },
  { label: "NTR", value: "ntr" },
  { label: "Psychological", value: "psychological" },
  { label: "Romance", value: "romance" },
  { label: "School Life", value: "school-life" },
  { label: "Sci-fi", value: "sci-fi" },
  { label: "Seinen", value: "seinen" },
  { label: "Shoujo", value: "shoujo" },
  { label: "Shounen", value: "shounen" },
  { label: "Slice of Life", value: "slice-of-life" },
  { label: "Smut", value: "smut" },
  { label: "Sports", value: "sports" },
  { label: "Supernatural", value: "supernatural" },
  { label: "Thriller", value: "thriller" },
  { label: "Tragedy", value: "tragedy" },
  { label: "Yaoi", value: "yaoi" },
  { label: "Yuri", value: "yuri" },
];

const WEBTOONS_GENRES = [
  { label: "Action", value: "action" },
  { label: "Comedy", value: "comedy" },
  { label: "Drama", value: "drama" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Graphic Novel", value: "graphic" },
  { label: "Heartwarming", value: "heartwarming" },
  { label: "Historical", value: "historical" },
  { label: "Horror", value: "horror" },
  { label: "Mystery", value: "mystery" },
  { label: "Romance", value: "romance" },
  { label: "Sci-fi", value: "sf" },
  { label: "Slice of Life", value: "slice" },
  { label: "Sports", value: "sports" },
  { label: "Superhero", value: "super" },
  { label: "Supernatural", value: "supernatural" },
  { label: "Thriller", value: "thriller" },
];

export default function SearchPage() {
  const {
    results, loading, error, search, loadLatest, loadPopular,
    browseMode, setBrowseMode,
    filters, setFilters,
    page, totalPages, hasMore, query, mode, setPage,
  } = useSearch();
  const [inputValue, setInputValue] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { selectedProvider } = useProvider();
  const inputRef = useRef<HTMLInputElement>(null);
  const providerRef = useRef(selectedProvider);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load latest manga on mount and when provider changes (reset filters — fresh load)
  useEffect(() => {
    if (providerRef.current !== selectedProvider) {
      providerRef.current = selectedProvider;
      setPage(1);
      const resetFilters = { tags: [], sort: "date", status: "", minChapters: 0 };
      filtersRef.current = resetFilters;
      setFilters(resetFilters);
    }
    loadLatest(selectedProvider, 1);
  }, [selectedProvider, loadLatest, setPage]);

  const handleBrowseModeChange = useCallback(
    (value: string) => {
      const newMode = value as "recent" | "popular";
      setBrowseMode(newMode);
      setPage(1);
      if (newMode === "recent") {
        loadLatest(selectedProvider, 1, filters);
      } else {
        loadPopular(selectedProvider, 1, filters);
      }
    },
    [selectedProvider, loadLatest, loadPopular, setBrowseMode, setPage, filters]
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      const newFilters = { ...filters, tags };
      setFilters(newFilters);
      setPage(1);
      if (browseMode === "recent") {
        loadLatest(selectedProvider, 1, newFilters);
      } else {
        loadPopular(selectedProvider, 1, newFilters);
      }
    },
    [selectedProvider, browseMode, loadLatest, loadPopular, filters, setFilters, setPage]
  );

  const handleQuickTag = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      handleTagsChange(newTags);
    },
    [filters.tags, handleTagsChange]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      const newFilters = { ...filters, status };
      setFilters(newFilters);
      setPage(1);
      if (browseMode === "recent") {
        loadLatest(selectedProvider, 1, newFilters);
      } else if (mode === "search" && query) {
        search(query, [selectedProvider], 1, newFilters);
      } else {
        loadPopular(selectedProvider, 1, newFilters);
      }
    },
    [selectedProvider, browseMode, mode, query, loadLatest, loadPopular, search, filters, setFilters, setPage]
  );

  const handleMinChaptersChange = useCallback(
    (minChapters: number) => {
      const newFilters = { ...filters, minChapters };
      setFilters(newFilters);
      setPage(1);
      if (browseMode === "recent") {
        loadLatest(selectedProvider, 1, newFilters);
      } else if (mode === "search" && query) {
        search(query, [selectedProvider], 1, newFilters);
      } else {
        loadPopular(selectedProvider, 1, newFilters);
      }
    },
    [selectedProvider, browseMode, mode, query, loadLatest, loadPopular, search, filters, setFilters, setPage]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        setPage(1);
        search(inputValue, [selectedProvider], 1, filters);
      }
    },
    [inputValue, selectedProvider, search, setPage, filters]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      if (mode === "search" && query) {
        search(query, [selectedProvider], newPage, filters);
      } else if (browseMode === "recent") {
        loadLatest(selectedProvider, newPage, filters);
      } else {
        loadPopular(selectedProvider, newPage, filters);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [mode, query, browseMode, selectedProvider, search, loadLatest, loadPopular, setPage, filters]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setPage(1);
    if (browseMode === "recent") {
      loadLatest(selectedProvider, 1, filters);
    } else {
      loadPopular(selectedProvider, 1, filters);
    }
    inputRef.current?.focus();
  }, [selectedProvider, browseMode, loadLatest, loadPopular, setPage, filters]);

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Search header */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {mode === "search" ? `Results for "${query}"` : "Browse Manga"}
        </h1>

        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center bg-bg-raised border border-border rounded-xl overflow-hidden group-focus-within:border-primary/50 transition-colors duration-300">
              <div className="pl-4 text-muted-foreground group-focus-within:text-primary-light transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Filter manga by title..."
                className="flex-1 px-4 py-3.5 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />

              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="pr-3 text-muted-foreground hover:text-zinc-300 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
                  </svg>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Active filter summary */}
        {(filters.status || filters.minChapters > 0) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted">Active filters:</span>
            {filters.status && (
              <button
                type="button"
                onClick={() => handleStatusChange("")}
                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {filters.status === "ongoing" ? "Ongoing" : "Completed"}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            {filters.minChapters > 0 && (
              <button
                type="button"
                onClick={() => handleMinChaptersChange(0)}
                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                {filters.minChapters}+ chapters
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Browse mode + Filters toggle */}
        <div className="mt-4 flex items-center gap-3">
          {mode === "browse" && (
            <SegmentedControl
              options={[
                { value: "recent", label: "Recent" },
                { value: "popular", label: "Popular" },
              ]}
              value={browseMode}
              onChange={handleBrowseModeChange}
            />
          )}
          {(selectedProvider === "manhwa18" || selectedProvider === "asurascans" || selectedProvider === "webtoons") && (
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-overlay text-muted hover:text-zinc-300 hover:border-border-hover transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              Filters
              {(filters.tags.length > 0 || filters.status || filters.minChapters > 0 || (filters.sort && filters.sort !== "date")) && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {filters.tags.length + (filters.status ? 1 : 0) + (filters.minChapters > 0 ? 1 : 0) + (filters.sort && filters.sort !== "date" ? 1 : 0)}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Webtoons loading notice */}
        <div className="mt-3">
          <WebtoonsNotice />
        </div>

        {/* Collapsible filter panel (manhwa18) */}
        {selectedProvider === "manhwa18" && filtersOpen && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-bg-raised animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genres */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted mb-2">Genres</label>
                <Combobox
                  options={MANHWA18_GENRES}
                  selected={filters.tags}
                  onChange={handleTagsChange}
                  searchPlaceholder="Search genres..."
                />
              </div>
            </div>

            {/* Popular genres quick select */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-muted mb-2">Popular genres</label>
              <div className="flex flex-wrap gap-2">
                {MANHWA18_GENRES.slice(0, 12).map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleQuickTag(tag.value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      filters.tags.includes(tag.value)
                        ? "bg-primary text-white"
                        : "bg-bg-overlay text-muted hover:text-zinc-300 border border-border hover:border-border-hover"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-muted mb-2">Chapters</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: "All" },
                  { value: 10, label: "10+" },
                  { value: 50, label: "50+" },
                  { value: 100, label: "100+" },
                  { value: 200, label: "200+" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMinChaptersChange(opt.value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      filters.minChapters === opt.value
                        ? "bg-primary text-white"
                        : "bg-bg-overlay text-muted hover:text-zinc-300 border border-border hover:border-border-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible filter panel (webtoons) */}
        {selectedProvider === "webtoons" && filtersOpen && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-bg-raised animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Genres */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted mb-2">Genres</label>
                <Combobox
                  options={WEBTOONS_GENRES}
                  selected={filters.tags}
                  onChange={handleTagsChange}
                  searchPlaceholder="Search genres..."
                />
              </div>
            </div>

            {/* Popular genres quick select */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-muted mb-2">Popular genres</label>
              <div className="flex flex-wrap gap-2">
                {WEBTOONS_GENRES.slice(0, 12).map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleQuickTag(tag.value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      filters.tags.includes(tag.value)
                        ? "bg-primary text-white"
                        : "bg-bg-overlay text-muted hover:text-zinc-300 border border-border hover:border-border-hover"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible filter panel (asurascans) */}
        {selectedProvider === "asurascans" && filtersOpen && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-bg-raised animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Status */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "All" },
                  { value: "ongoing", label: "Ongoing" },
                  { value: "completed", label: "Completed" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      filters.status === opt.value
                        ? "bg-primary text-white"
                        : "bg-bg-overlay text-muted hover:text-zinc-300 border border-border hover:border-border-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2">Chapters</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 0, label: "All" },
                  { value: 10, label: "10+" },
                  { value: 50, label: "50+" },
                  { value: 100, label: "100+" },
                  { value: 200, label: "200+" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMinChaptersChange(opt.value)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      filters.minChapters === opt.value
                        ? "bg-primary text-white"
                        : "bg-bg-overlay text-muted hover:text-zinc-300 border border-border hover:border-border-hover"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      <MangaGrid
        manga={results}
        loading={loading}
        page={page}
        totalPages={totalPages}
        hasMore={hasMore}
        onPageChange={handlePageChange}
        showChapterBadges
        emptyMessage={
          mode === "search" && !loading
            ? `No results found for "${query}"`
            : "No manga available"
        }
      />
    </div>
  );
}
