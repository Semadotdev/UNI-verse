"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ReaderProvider } from "@/contexts/ReaderContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <LibraryProvider>
          <ReaderProvider>
            {children}
            <ToastContainer />
          </ReaderProvider>
        </LibraryProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
