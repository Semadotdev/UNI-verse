"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  FEATURE_NOTIFICATIONS,
  NOTIFICATIONS_STORAGE_KEY,
} from "@/lib/notifications";

const readListeners = new Set<() => void>();
let readIdsCache: string[] | null = null;
const EMPTY_READ_IDS: string[] = [];

function readStored(): string[] {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

function getReadIdsSnapshot(): string[] {
  if (readIdsCache === null) readIdsCache = readStored();
  return readIdsCache;
}

function subscribeReadIds(cb: () => void): () => void {
  readListeners.add(cb);
  return () => readListeners.delete(cb);
}

function setStoredReadIds(ids: string[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
  readIdsCache = ids;
  readListeners.forEach((l) => l());
}

interface NotificationBellProps {
  variant?: "desktop" | "mobile";
}

export function NotificationBell({ variant = "desktop" }: NotificationBellProps) {
  const pathname = usePathname();
  const readIds = useSyncExternalStore(
    subscribeReadIds,
    getReadIdsSnapshot,
    () => EMPTY_READ_IDS
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allIds = FEATURE_NOTIFICATIONS.map((n) => n.id);
  const unreadCount = FEATURE_NOTIFICATIONS.filter(
    (n) => !readIds.includes(n.id)
  ).length;

  const markAllRead = () => {
    setStoredReadIds(allIds);
  };

  const toggleDesktop = () => {
    if (!dropdownOpen) markAllRead();
    setDropdownOpen((v) => !v);
  };

  const openMobile = () => {
    markAllRead();
    setMobileOpen(true);
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dropdownOpen]);

  const isReadRoute = pathname.startsWith("/read");

  const notificationList = (
    <ul className="space-y-1">
      {FEATURE_NOTIFICATIONS.map((n) => {
        const isUnread = !readIds.includes(n.id);
        return (
          <li
            key={n.id}
            className="rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-overlay"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">
                {n.title}
              </span>
              {isUnread && (
                <span className="rounded-full bg-primary/15 text-primary-light border border-primary/30 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  NEW
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">{n.description}</p>
            <p className="mt-1 text-[10px] text-muted">{n.date}</p>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "mobile") {
    if (isReadRoute) return null;
    return (
      <>
        <button
          onClick={openMobile}
          className="md:hidden fixed top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-bg-raised/95 backdrop-blur-md border border-border shadow-xl text-muted hover:text-zinc-200 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <Modal
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="What&apos;s new"
          size="sm"
        >
          {notificationList}
        </Modal>
      </>
    );
  }

  return (
    <div ref={dropdownRef} className="relative hidden md:block">
      <button
        onClick={toggleDesktop}
        className="relative flex items-center px-3 py-2 rounded-lg text-sm text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-all duration-200"
        aria-label="Notifications"
        title="What's new"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 z-50 mt-1 w-80 max-h-96 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl p-2 animate-dropdown">
          <p className="px-3 py-2 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">
            What&apos;s new
          </p>
          {notificationList}
        </div>
      )}
    </div>
  );
}
