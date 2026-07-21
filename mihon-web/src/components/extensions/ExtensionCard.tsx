"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KeiyoushiExtension } from "@/lib/sources/keiyoushi";
import { Download, Trash2, Globe, Languages } from "lucide-react";

interface ExtensionCardProps {
  extension: KeiyoushiExtension;
  installed: boolean;
  onInstall: (pkg: string) => void;
  onUninstall: (pkg: string) => void;
}

const LANG_NAMES: Record<string, string> = {
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

export function ExtensionCard({
  extension,
  installed,
  onInstall,
  onUninstall,
}: ExtensionCardProps) {
  const langName = LANG_NAMES[extension.lang] || extension.lang;
  const sourceCount = extension.sources.length;

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/30">
      {extension.nsfw === 1 && (
        <div className="absolute right-2 top-2 rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
          NSFW
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-zinc-100">
            {extension.name.replace("Tachiyomi: ", "")}
          </h3>

          <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Languages className="h-3.5 w-3.5" />
              {langName}
            </span>
            <span>v{extension.version}</span>
            {sourceCount > 1 && (
              <span className="text-zinc-500">{sourceCount} sources</span>
            )}
          </div>

          {extension.sources.length > 0 && (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {extension.sources[0].baseUrl}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {installed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUninstall(extension.pkg)}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onInstall(extension.pkg)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Install
          </Button>
        )}
      </div>
    </Card>
  );
}
