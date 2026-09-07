"use client";

import { ReactNode, useEffect } from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import { BatchAddProgress } from "@/components/library/BatchAddProgress";
import { registerRewardFlusher } from "@/lib/reward-queue";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    return registerRewardFlusher();
  }, []);

  return (
    <ToastProvider>
      <SettingsProvider>
        <LibraryProvider>
          <ProviderProvider>
            {children}
          </ProviderProvider>
          <BatchAddProgress />
        </LibraryProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
