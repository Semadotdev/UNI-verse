"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Source {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

const SOURCE_EMOJI: Record<string, string> = {
  mangadex: "🌐",
  mangasee: "📖",
};

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((data) => {
        setSources(data);
        setLoadingSources(false);
      })
      .catch((err) => {
        console.error("Failed to fetch sources:", err);
        setLoadingSources(false);
      });
  }, []);

  const enabledSourcesList = settings.enabledSources
    ? settings.enabledSources.split(",").filter(Boolean)
    : [];

  const isSourceEnabled = (sourceId: string) => {
    return enabledSourcesList.includes(sourceId);
  };

  const toggleSource = (sourceId: string) => {
    const current = enabledSourcesList;
    let updated: string[];
    if (current.includes(sourceId)) {
      updated = current.filter((id) => id !== sourceId);
    } else {
      updated = [...current, sourceId];
    }
    updateSettings({ enabledSources: updated.join(",") });
  };

  return (
    <div className="mx-auto max-w-2xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Theme</label>
              <div className="flex gap-2">
                {["light", "dark", "system"].map((t) => (
                  <Button
                    key={t}
                    variant={settings.theme === t ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => updateSettings({ theme: t })}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Reader</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Default Mode
              </label>
              <div className="flex gap-2">
                {["page", "webtoon"].map((mode) => (
                  <Button
                    key={mode}
                    variant={settings.readerMode === mode ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => updateSettings({ readerMode: mode })}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Reading Direction
              </label>
              <div className="flex gap-2">
                {["ltr", "rtl"].map((dir) => (
                  <Button
                    key={dir}
                    variant={settings.readingDir === dir ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => updateSettings({ readingDir: dir })}
                  >
                    {dir.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Extensions</h2>
          {loadingSources ? (
            <p className="text-sm text-zinc-400">Loading sources...</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-zinc-400">No sources available.</p>
          ) : (
            <div className="space-y-3">
              {sources.map((source) => {
                const enabled = isSourceEnabled(source.id);
                return (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      enabled
                        ? "border-primary/30 bg-primary/5"
                        : "border-zinc-800 bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {SOURCE_EMOJI[source.id] ?? "📦"}
                      </span>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-zinc-400">
                          {source.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={enabled ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => toggleSource(source.id)}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">About</h2>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Mihon Web - A web-based manga reader</p>
            <p>Version 1.0.0</p>
            <p className="mt-4">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
