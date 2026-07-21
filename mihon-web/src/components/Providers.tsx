"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ReaderProvider } from "@/contexts/ReaderContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <ReaderProvider>{children}</ReaderProvider>
      </LibraryProvider>
    </SettingsProvider>
  );
}
