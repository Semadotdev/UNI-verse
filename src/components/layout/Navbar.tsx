"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UNIverseLogo } from "@/components/UNIverseLogo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ProviderDropdown } from "@/components/navbar/ProviderDropdown";
import { Modal } from "@/components/ui/Modal";
import { useProvider } from "@/contexts/ProviderContext";
import type { User } from "@supabase/supabase-js";

interface ProviderInfo {
  id: string;
  name: string;
  nsfw: boolean;
}

const navItems = [
  { href: "/", label: "Home", icon: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
  { href: "/search", label: "Search", icon: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>) },
  { href: "/library", label: "Library", icon: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>) },
  { href: "/history", label: "History", icon: (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) },
];

const NsfwBadge = () => (
  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full leading-none">
    18+
  </span>
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { selectedProvider, setSelectedProvider } = useProvider();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers ?? []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleProviderChange = (id: string) => {
    setSelectedProvider(id);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const priority: Record<string, number> = { asurascans: 0, mangago: 1 };
  const sortedProviders = [...providers].sort((a, b) => {
    const pa = priority[a.id] ?? 2;
    const pb = priority[b.id] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-raised/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]",
                  isActive ? "text-primary-light" : "text-muted hover:text-zinc-300"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full shadow-glow-sm" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[48px]",
              mobileMenuOpen ? "text-primary-light" : "text-muted hover:text-zinc-300"
            )}
          >
            <div className="relative">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile settings modal */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Settings"
        size="sm"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Source</p>
          {sortedProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all",
                p.id === selectedProvider
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {p.name}
              {p.nsfw && <NsfwBadge />}
              {p.id === selectedProvider && (
                <svg className="ml-auto h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {user && (
          <>
            <div className="my-4 border-t border-zinc-800" />
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setConfirmLogout(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </>
        )}
      </Modal>

      {/* Confirm logout modal */}
      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Sign out"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmLogout(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-bg-raised text-zinc-300 hover:border-primary/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmLogout(false);
                handleLogout();
              }}
              className="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
            >
              Sign Out
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-300">Are you sure you want to sign out?</p>
      </Modal>

      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-6 bg-bg-raised/95 backdrop-blur-md border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <UNIverseLogo size={32} />
          <span className="text-lg font-bold tracking-tight hidden lg:block">
            <span className="text-white">UNI</span>
            <span className="text-primary-light">-</span>
            <span className="text-white">verse</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "text-primary-light bg-primary/15"
                    : "text-muted hover:text-zinc-200 hover:bg-bg-overlay"
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full shadow-glow-sm" />
                )}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-border mx-1" />

          <ProviderDropdown />

          {/* Auth button */}
          {user ? (
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-all duration-200 ml-2"
              title="Sign out"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="font-medium hidden lg:inline">Sign Out</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-all duration-200 ml-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span className="font-medium hidden lg:inline">Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
