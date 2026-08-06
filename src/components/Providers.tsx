"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import { BatchAddProgress } from "@/components/library/BatchAddProgress";

export function Providers({ children }: { children: ReactNode }) {
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
