"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

const THEME_ORDER = ["dark", "light", "system"] as const;
type Theme = (typeof THEME_ORDER)[number];

const ICONS: Record<Theme, { Icon: typeof Sun; label: string }> = {
  dark: { Icon: Moon, label: "Dark" },
  light: { Icon: Sun, label: "Light" },
  system: { Icon: Monitor, label: "System" },
};

function useTheme() {
  const { settings, updateSettings } = useSettings();
  const current: Theme = THEME_ORDER.includes(settings.theme as Theme)
    ? (settings.theme as Theme)
    : "system";
  return { current, updateTheme: (theme: Theme) => updateSettings({ theme }) };
}

export function ThemeToggle() {
  const { current, updateTheme } = useTheme();
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  const { Icon, label } = ICONS[next];

  return (
    <button
      onClick={() => updateTheme(next)}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-all duration-200"
      title={`Switch theme to ${label}`}
      aria-label={`Switch theme to ${label} (current: ${current})`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function ThemePicker() {
  const { current, updateTheme } = useTheme();

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Theme</p>
      {THEME_ORDER.map((theme) => {
        const { Icon, label } = ICONS[theme];
        return (
          <button
            key={theme}
            onClick={() => updateTheme(theme)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
              theme === current
                ? "bg-primary/10 text-primary"
                : "text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {theme === current && (
              <svg
                className="ml-auto h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
