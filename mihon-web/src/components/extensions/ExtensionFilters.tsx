"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Eye, EyeOff } from "lucide-react";

interface ExtensionFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: string[];
  showNsfw: boolean;
  onNsfwToggle: () => void;
  total: number;
  filtered: number;
}

const LANG_LABELS: Record<string, string> = {
  "": "All Languages",
  en: "English",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ar: "Arabic",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  tr: "Turkish",
  "pt-BR": "Brazilian Portuguese",
  "zh-Hans": "Simplified Chinese",
  all: "Multi-language",
};

export function ExtensionFilters({
  query,
  onQueryChange,
  language,
  onLanguageChange,
  languages,
  showNsfw,
  onNsfwToggle,
  total,
  filtered,
}: ExtensionFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search extensions..."
            className="pl-10"
          />
        </div>

        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {["", ...languages].map((lang) => (
            <option key={lang} value={lang}>
              {LANG_LABELS[lang] || lang}
            </option>
          ))}
        </select>

        <Button
          variant={showNsfw ? "primary" : "ghost"}
          size="sm"
          onClick={onNsfwToggle}
          className="shrink-0"
        >
          {showNsfw ? (
            <Eye className="mr-1.5 h-4 w-4" />
          ) : (
            <EyeOff className="mr-1.5 h-4 w-4" />
          )}
          NSFW
        </Button>
      </div>

      <p className="text-sm text-zinc-500">
        {filtered} of {total} extensions
      </p>
    </div>
  );
}
