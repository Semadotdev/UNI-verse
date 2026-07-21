"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { Spinner } from "@/components/ui/Spinner";

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
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <div className="mb-8 max-w-xl">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : searched ? (
        <SearchResults results={results} />
      ) : (
        <p className="text-center text-zinc-500">
          Search for manga across multiple sources
        </p>
      )}
    </div>
  );
}
