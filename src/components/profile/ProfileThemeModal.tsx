"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Coins } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiClient } from "@/lib/api-client";
import { ProfileThemeBackground } from "@/components/profile/ProfileThemeBackground";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import { DEFAULT_THEME_ID } from "@/domain/constants/profile-themes";
import type { ProfileTheme } from "@/domain/constants/profile-themes";

export interface ThemesState {
  themes: ProfileTheme[];
  ownedThemeIds: string[];
  activeThemeId: string | null;
  coins: number;
}

interface ProfileThemeModalProps {
  open: boolean;
  onClose: () => void;
  initialCoins: number;
  onCoinsChange: (coins: number) => void;
  onApplied: (themeId: string) => void;
}

type Tab = "shop" | "mine";

export function ProfileThemeModal({
  open,
  onClose,
  initialCoins,
  onCoinsChange,
  onApplied,
}: ProfileThemeModalProps) {
  const { addToast } = useToast();
  const [state, setState] = useState<ThemesState | null>(null);
  const [tab, setTab] = useState<Tab>("shop");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    ApiClient.get<ThemesState>("/api/themes")
      .then((s) => {
        if (cancelled) return;
        setState(s);
        onCoinsChange(s.coins);
      })
      .catch(() => addToast("Failed to load themes", "error"));
    return () => {
      cancelled = true;
    };
  }, [open, addToast, onCoinsChange]);

  if (!open) return null;

  const themes = state?.themes ?? [];
  const owned = new Set(state?.ownedThemeIds ?? []);
  const coins = state?.coins ?? initialCoins;
  const activeId = state?.activeThemeId ?? null;
  const visible = tab === "shop" ? themes : themes.filter((t) => owned.has(t.id));

  const purchase = async (themeId: string) => {
    setBusy(themeId);
    try {
      const s = await ApiClient.post<ThemesState>("/api/themes/purchase", { themeId });
      setState(s);
      onCoinsChange(s.coins);
      addToast("Theme purchased", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Purchase failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const apply = async (themeId: string) => {
    setBusy(themeId);
    try {
      const s = await ApiClient.post<ThemesState>("/api/themes/apply", { themeId });
      setState(s);
      onApplied(themeId);
      addToast("Theme applied", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Apply failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Themes" size="md">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-bg-overlay p-1">
          <TabButton active={tab === "shop"} onClick={() => setTab("shop")}>
            Shop
          </TabButton>
          <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
            Mine
          </TabButton>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
          <Coins className="h-4 w-4 text-yellow-400" />
          {coins}
        </span>
      </div>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {tab === "mine"
              ? "You don't own any themes yet. Head to the Shop tab!"
              : "No themes available."}
          </p>
        ) : (
          visible.map((t) => {
            const isOwned = owned.has(t.id);
            const isActive = activeId === t.id || (t.id === DEFAULT_THEME_ID && activeId === null);
            const canAfford = coins >= t.price;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg-overlay p-3"
              >
                <div
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.background[0]}, ${t.colors.background[1]})`,
                  }}
                >
                  <ProfileThemeBackground theme={t} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                  <p className="truncate text-xs text-muted">{t.description}</p>
                </div>
                {isOwned ? (
                  isActive ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => apply(t.id)}
                      disabled={busy === t.id}
                      className="rounded-lg border border-border bg-bg-raised px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-zinc-100 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => purchase(t.id)}
                    disabled={busy === t.id || !canAfford}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                      canAfford
                        ? "bg-primary text-white hover:bg-primary-light"
                        : "bg-bg-raised text-muted"
                    )}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    {t.price}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-white" : "text-zinc-300 hover:text-zinc-100"
      )}
    >
      {children}
    </button>
  );
}
