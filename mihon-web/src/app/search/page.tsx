"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Globe } from "lucide-react";
import { MangaWebsite } from "@/lib/sources/websites";

export default function SearchPage() {
  const [websites, setWebsites] = useState<MangaWebsite[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    fetch("/api/websites")
      .then((r) => r.json())
      .then((data) => setWebsites(data))
      .catch(() => {});
  }, []);

  const selectedWebsite = websites.find((w) => w.id === selectedSite);

  const handleSearch = async (query: string) => {
    if (!selectedSite) return;
    setLoading(true);
    setSearched(true);
    setNoResults(false);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&source=${selectedSite}`
      );
      const data = await res.json();
      
      // Check if any source returned results
      const hasResults = data.some((r: any) => r.items && r.items.length > 0);
      setResults(data);
      setNoResults(!hasResults);
    } catch (error) {
      console.error("Search failed:", error);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      <h1 className="mb-6 text-2xl font-bold">Search</h1>

      {/* Website selector */}
      <div className="mb-6 max-w-xl">
        <label className="mb-2 block text-sm text-zinc-400">
          Select a website to search
        </label>
        <div className="flex flex-wrap gap-2">
          {websites.map((site) => (
            <Button
              key={site.id}
              variant={selectedSite === site.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => {
                setSelectedSite(site.id);
                setSearched(false);
                setResults([]);
                setNoResults(false);
              }}
            >
              <span className="mr-1">{site.icon}</span>
              {site.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Search bar (only show after site selection) */}
      {selectedSite && (
        <div className="mb-8 max-w-xl">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div>
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-zinc-800" />
          <MangaGridSkeleton count={6} />
        </div>
      ) : searched && noResults && selectedWebsite ? (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title="No results found"
          description={`The scraper for ${selectedWebsite.name} couldn't find results. Try visiting the website directly.`}
          actionLabel={`Search on ${selectedWebsite.name}`}
          onAction={() => {
            if (selectedWebsite) {
              window.open(selectedWebsite.searchUrl(""), "_blank");
            }
          }}
        />
      ) : searched ? (
        <SearchResults results={results} />
      ) : selectedSite ? (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title="Search for manga"
          description={`Search ${selectedWebsite?.name || "the selected website"} for manga`}
        />
      ) : (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title="Select a website first"
          description="Choose a manga website above to start searching"
        />
      )}

      {/* Direct link to website */}
      {selectedWebsite && (
        <div className="mt-8 text-center">
          <a
            href={selectedWebsite.searchUrl("")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-primary"
          >
            Or search directly on {selectedWebsite.name}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
