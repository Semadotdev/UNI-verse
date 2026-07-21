"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { SearchResult } from "@/lib/sources/types";

interface SourceInfo {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

type Tab = "latest" | "popular";

export default function SourcePage() {
  const params = useParams();
  const router = useRouter();
  const sourceId = params.id as string;

  const [source, setSource] = useState<SourceInfo | null>(null);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("latest");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch source info
  useEffect(() => {
    async function loadSource() {
      try {
        const res = await fetch("/api/sources");
        if (res.ok) {
          const sources: SourceInfo[] = await res.json();
          const found = sources.find((s) => s.id === sourceId);
          setSource(found || null);
        }
      } catch (error) {
        console.error("Failed to load source:", error);
      }
    }
    loadSource();
  }, [sourceId]);

  // Fetch browse items when tab changes
  useEffect(() => {
    async function loadBrowse() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sources/${sourceId}/browse?tab=${activeTab}&page=1`
        );
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Failed to load browse data:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadBrowse();
  }, [sourceId, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&source=${sourceId}`
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Source Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          {source ? source.name : "Source"}
        </h1>
        {source && (
          <p className="mt-1 text-zinc-400">
            Browse {source.name} manga collection
          </p>
        )}
      </div>

      {/* Search Bar Scoped to Source */}
      <form onSubmit={handleSearch} className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${source?.name || "this source"}...`}
          className="pl-10"
        />
      </form>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-900 p-1 max-w-xs">
        <button
          onClick={() => setActiveTab("latest")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "latest"
              ? "bg-primary text-primary-foreground"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Latest
        </button>
        <button
          onClick={() => setActiveTab("popular")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "popular"
              ? "bg-primary text-primary-foreground"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Popular
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : items.length > 0 ? (
        <MangaGrid manga={items} sourceId={sourceId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <p className="text-lg">No manga found</p>
          <p className="text-sm">
            {activeTab === "latest"
              ? "No latest manga available from this source"
              : "No popular manga available from this source"}
          </p>
        </div>
      )}
    </div>
  );
}
