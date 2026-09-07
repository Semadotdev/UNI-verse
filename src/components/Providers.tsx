"use client";

import { ReactNode, useEffect } from "react";
import { ToastProvider, useToast } from "@/contexts/ToastContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import { BatchAddProgress } from "@/components/library/BatchAddProgress";
import { onRewardConfirmed, registerRewardFlusher } from "@/lib/reward-queue";

function RewardCoinToaster() {
  const { addToast } = useToast();
  useEffect(() => {
    onRewardConfirmed(() => addToast("You earned a coin!", "success"));
    return () => onRewardConfirmed(null);
  }, [addToast]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    return registerRewardFlusher();
  }, []);

  return (
    <ToastProvider>
      <RewardCoinToaster />
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