"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();

  const handleThemeChange = (theme: string) => {
    updateSettings({ theme });
    addToast(`Theme set to ${theme}`, "success");
  };

  const handleReaderModeChange = (mode: string) => {
    updateSettings({ readerMode: mode });
    addToast(`Reader mode set to ${mode}`, "success");
  };

  const handleReadingDirChange = (dir: string) => {
    updateSettings({ readingDir: dir });
    addToast(`Reading direction set to ${dir.toUpperCase()}`, "success");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 animate-fade-in-up">
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
                    onClick={() => handleThemeChange(t)}
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
                    onClick={() => handleReaderModeChange(mode)}
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
                    onClick={() => handleReadingDirChange(dir)}
                  >
                    {dir.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
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
