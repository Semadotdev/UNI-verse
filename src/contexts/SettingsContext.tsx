"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  loading: boolean;
}

const defaultSettings: Settings = {
  theme: "dark",
  readerMode: "paged",
  readingDirection: "ltr",
  backgroundColor: "#000000",
  brightness: 1.0,
  padding: 0,
  language: "en",
  readingMode: "paged",
  scaleType: "contain",
  zoomStartPosition: "center",
  showPageNumber: true,
  tapZoneLayout: "disabled",
  cropBorders: false,
  sidePadding: 0,
  doubleTapZoom: true,
  splitWidePages: true,
  pagePreloadCount: 2,
};

const STORAGE_KEY = "uni-verse-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch {}
  return defaultSettings;
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [loading] = useState(false);

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
