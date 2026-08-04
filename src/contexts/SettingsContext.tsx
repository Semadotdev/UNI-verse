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

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
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
        setSettings({ ...defaultSettings, ...parsed });
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
