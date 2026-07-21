"use client";

import { useEffect, useState, useCallback } from "react";
import { ExtensionCard } from "@/components/extensions/ExtensionCard";
import { ExtensionFilters } from "@/components/extensions/ExtensionFilters";
import { MangaGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/contexts/ToastContext";
import { KeiyoushiExtension, getLanguages } from "@/lib/sources/keiyoushi";
import { Puzzle } from "lucide-react";

interface ApiData {
  total: number;
  filtered: number;
  extensions: KeiyoushiExtension[];
}

export default function ExtensionsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [showNsfw, setShowNsfw] = useState(false);
  const [installedPkgs, setInstalledPkgs] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (language) params.set("lang", language);
      if (showNsfw) params.set("nsfw", "true");

      const res = await fetch(`/api/keiyoushi?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);

        if (languages.length === 0 && result.extensions) {
          setLanguages(getLanguages(result.extensions));
        }
      }
    } catch {
      addToast("Failed to load extensions", "error");
    } finally {
      setLoading(false);
    }
  }, [query, language, showNsfw, languages.length, addToast]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  useEffect(() => {
    fetch("/api/sources/installed")
      .then((r) => r.json())
      .then((exts) => {
        if (Array.isArray(exts)) {
          setInstalledPkgs(exts.map((e: KeiyoushiExtension) => e.pkg));
        }
      })
      .catch(() => {});
  }, []);

  const handleInstall = async (pkg: string) => {
    try {
      await fetch("/api/sources/installed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg, action: "install" }),
      });
      setInstalledPkgs((prev) => [...prev, pkg]);
      addToast("Extension installed", "success");
    } catch {
      addToast("Failed to install extension", "error");
    }
  };

  const handleUninstall = async (pkg: string) => {
    try {
      await fetch("/api/sources/installed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pkg, action: "uninstall" }),
      });
      setInstalledPkgs((prev) => prev.filter((p) => p !== pkg));
      addToast("Extension removed", "success");
    } catch {
      addToast("Failed to remove extension", "error");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Extensions</h1>
        <p className="mt-1 text-zinc-400">
          Browse and install manga sources from the Keiyoushi repository
        </p>
      </div>

      <ExtensionFilters
        query={query}
        onQueryChange={setQuery}
        language={language}
        onLanguageChange={setLanguage}
        languages={languages}
        showNsfw={showNsfw}
        onNsfwToggle={() => setShowNsfw(!showNsfw)}
        total={data?.total || 0}
        filtered={data?.filtered || 0}
      />

      {loading ? (
        <MangaGridSkeleton count={12} />
      ) : data && data.extensions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.extensions.map((ext) => (
            <ExtensionCard
              key={ext.pkg}
              extension={ext}
              installed={installedPkgs.includes(ext.pkg)}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Puzzle className="h-8 w-8" />}
          title="No extensions found"
          description="Try adjusting your search or filters"
        />
      )}
    </div>
  );
}
