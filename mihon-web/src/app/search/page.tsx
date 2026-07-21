"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <div className="mb-8 max-w-xl">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div>
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-zinc-800" />
          <MangaGridSkeleton count={6} />
        </div>
      ) : searched ? (
        <SearchResults results={results} />
      ) : (
        <EmptyState
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-zinc-600"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          title="Search for manga"
          description="Search across multiple sources to find your next read"
        />
      )}
    </div>
  );
}
