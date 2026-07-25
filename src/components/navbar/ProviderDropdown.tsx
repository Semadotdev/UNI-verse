"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dropdown, type DropdownItem } from "@/components/ui/Dropdown";
import { useProvider } from "@/contexts/ProviderContext";

interface ProviderInfo {
  id: string;
  name: string;
  nsfw: boolean;
}

const NsfwBadge = () => (
  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full leading-none">
    18+
  </span>
);

export function ProviderDropdown() {
  const { selectedProvider, setSelectedProvider } = useProvider();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch("/api/providers");
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers);
        }
      } catch (e) {
        console.error("Failed to fetch providers:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const currentName = currentProvider?.name ?? "Source";

  const priority: Record<string, number> = { asurascans: 0 };
  const sorted = [...providers].sort((a, b) => {
    const pa = priority[a.id] ?? 2;
    const pb = priority[b.id] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  const items: DropdownItem[] = sorted.map((p) => ({
    label: p.name,
    badge: p.nsfw ? <NsfwBadge /> : undefined,
    active: p.id === selectedProvider,
    onClick: () => {
      setSelectedProvider(p.id);
      router.push("/");
    },
  }));

  if (loading) {
    return (
      <div className="h-9 w-24 bg-bg-overlay rounded-lg animate-pulse" />
    );
  }

  return (
    <Dropdown
      align="left"
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-all duration-200">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="hidden lg:inline">{currentName}</span>
          <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      }
      items={items}
    />
  );
}