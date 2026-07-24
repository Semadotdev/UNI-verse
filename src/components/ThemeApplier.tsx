"use client";

import { useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";

function applyTheme(theme: string) {
  const html = document.documentElement;
  if (theme === "light") {
    html.classList.remove("dark");
    html.classList.add("light");
  } else if (theme === "dark") {
    html.classList.remove("light");
    html.classList.add("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.toggle("dark", prefersDark);
    html.classList.toggle("light", !prefersDark);
  }
}

export function ThemeApplier() {
  const { settings } = useSettings();

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (settings.theme !== "system") return;

    const handler = () => applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [settings.theme]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "uni-verse-settings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.theme) applyTheme(parsed.theme);
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return null;
}
