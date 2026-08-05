"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface Settings {
  theme: string;
  readerMode: string;
  readingDirection: string;
  backgroundColor: string;
  brightness: number;
  padding: number;
  language: string;

  readingMode: string;
  scaleType: string;
  zoomStartPosition: string;
  showPageNumber: boolean;
  tapZoneLayout: string;
  cropBorders: boolean;
  sidePadding: number;
  doubleTapZoom: boolean;
  splitWidePages: boolean;
  pagePreloadCount: number;
  autoScrollSpeed: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  loading: boolean;
}

const defaultSettings: Settings = {
  theme: "dark",
  readerMode: "webtoon",
  readingDirection: "ltr",
  backgroundColor: "#000000",
  brightness: 1.0,
  padding: 0,
  language: "en",
  readingMode: "long-strip",
  scaleType: "contain",
  zoomStartPosition: "center",
  showPageNumber: true,
  tapZoneLayout: "disabled",
  cropBorders: false,
  sidePadding: 0,
  doubleTapZoom: true,
  splitWidePages: true,
  pagePreloadCount: 2,
  autoScrollSpeed: 3,
};

const STORAGE_KEY = "uni-verse-settings";
const SETTINGS_VERSION = 2;
const VALID_READING_MODES = ["long-strip", "paged-ltr", "paged-rtl", "paged-vertical"];

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: SETTINGS_VERSION }));
  } catch {}
}

function migrateSettings(stored: unknown): Settings {
  const parsed = stored && typeof stored === "object"
    ? stored as Partial<Settings>
    : {};
  const migrated: Settings = { ...defaultSettings, ...parsed };

  if (!VALID_READING_MODES.includes(migrated.readingMode)) {
    migrated.readingMode = defaultSettings.readingMode;
  }

  return migrated;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedVersion = (parsed && typeof parsed === "object" && "version" in parsed)
          ? (parsed as { version: number }).version
          : undefined;
        const settings = migrateSettings(parsed);
        setSettings(settings);
        if (storedVersion !== SETTINGS_VERSION) {
          saveSettings(settings);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
