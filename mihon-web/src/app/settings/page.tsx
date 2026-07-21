"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [readerMode, setReaderMode] = useState("page");
  const [readingDir, setReadingDir] = useState("rtl");

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
                    variant={theme === t ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setTheme(t)}
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
                    variant={readerMode === mode ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setReaderMode(mode)}
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
                    variant={readingDir === dir ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setReadingDir(dir)}
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
