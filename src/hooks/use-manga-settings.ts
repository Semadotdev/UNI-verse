"use client";

import { useState, useCallback } from "react";

export interface MangaOverrides {
  readingMode?: string;
  scaleType?: string;
  readingDirection?: string;
  backgroundColor?: string;
  brightness?: number;
  cropBorders?: boolean;
  sidePadding?: number;
}

const STORAGE_PREFIX = "uni-verse-manga-settings:";

function getKey(providerId: string, mangaId: string) {
  return `${STORAGE_PREFIX}${providerId}:${mangaId}`;
}

function loadOverrides(providerId: string, mangaId: string): MangaOverrides {
  try {
    const raw = localStorage.getItem(getKey(providerId, mangaId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(providerId: string, mangaId: string, overrides: MangaOverrides) {
  const cleaned = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined && v !== null)
  );
  if (Object.keys(cleaned).length === 0) {
    localStorage.removeItem(getKey(providerId, mangaId));
  } else {
    localStorage.setItem(getKey(providerId, mangaId), JSON.stringify(cleaned));
  }
}

export function useMangaSettings(providerId: string, mangaId: string) {
  const [overrides, setOverrides] = useState<MangaOverrides>(() =>
    loadOverrides(providerId, mangaId)
  );

  const updateOverride = useCallback(
    (updates: Partial<MangaOverrides>) => {
      setOverrides((prev) => {
        const next = { ...prev, ...updates };
        saveOverrides(providerId, mangaId, next);
        return next;
      });
    },
    [providerId, mangaId]
  );

  const resetOverrides = useCallback(() => {
    setOverrides({});
    localStorage.removeItem(getKey(providerId, mangaId));
  }, [providerId, mangaId]);

  return { overrides, updateOverride, resetOverrides };
}

export function mergeSettings<T extends object>(
  global: T,
  overrides: Partial<T>
): T {
  return { ...global, ...overrides };
}
