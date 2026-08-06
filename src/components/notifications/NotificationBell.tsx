"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { ApiClient } from "@/lib/api-client";
import { timeAgo } from "@/shared/utils/time";
import type { AppNotification } from "@/domain/entities/notification";
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

type TabKey = "activity" | "whatsnew";

const TABS: { key: TabKey; label: string }[] = [
  { key: "activity", label: "Activity" },
  { key: "whatsnew", label: "What's new" },
];

function NotificationTabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Notifications"
      className="flex gap-1 rounded-lg bg-zinc-800/60 p-1"
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
            tab === t.key
              ? "bg-primary/15 text-primary"
              : "text-muted hover:text-zinc-200"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ActivityItem({ n }: { n: AppNotification }) {
  const isUnread = !n.read;
  const actorName = n.actor.name ?? n.actor.username ?? "Someone";
  const initials = (n.actor.username ?? "?").slice(0, 1).toUpperCase();
  const href =
    n.type === "friend" && n.actor.username
      ? `/profile/${encodeURIComponent(n.actor.username)}`
      : "/posts";
  const verb =
    n.type === "like"
      ? "liked your post"
      : n.type === "comment"
        ? "commented on your post"
        : "added you as a friend";

  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-bg-overlay"
      >
        <div className="flex items-center gap-2">
          {n.actor.avatarUrl ? (
            <img
              src={n.actor.avatarUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="h-6 w-6 shrink-0 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-[11px] font-bold">
              {initials}
            </span>
          )}
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {actorName}
          </span>
          {isUnread && (
            <span className="rounded-full bg-primary/15 text-primary-light border border-primary/30 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              NEW
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">{verb}</p>
        {n.type === "comment" && n.postSnippet && (
          <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
            &ldquo;{n.postSnippet}&rdquo;
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted">{timeAgo(n.createdAt)}</p>
      </Link>
    </li>
  );
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
  const [activity, setActivity] = useState<AppNotification[]>([]);
  const [activityUnread, setActivityUnread] = useState(0);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>("activity");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const allIds = FEATURE_NOTIFICATIONS.map((n) => n.id);
  const systemUnread = FEATURE_NOTIFICATIONS.filter(
    (n) => !readIds.includes(n.id)
  ).length;
  const unreadCount = activityUnread + systemUnread;

  const refreshActivity = useCallback(async () => {
    try {
      const res = await ApiClient.get<{
        notifications: AppNotification[];
        unreadCount: number;
      }>("/api/notifications?limit=30");
      setActivity(res.notifications);
      setActivityUnread(res.unreadCount);
    } catch {
      setActivity([]);
      setActivityUnread(0);
    } finally {
      setActivityLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    ApiClient.get<{
      notifications: AppNotification[];
      unreadCount: number;
    }>("/api/notifications?limit=30")
      .then((res) => {
        if (cancelled) return;
        setActivity(res.notifications);
        setActivityUnread(res.unreadCount);
      })
      .catch(() => {
        if (cancelled) return;
        setActivity([]);
        setActivityUnread(0);
      })
      .finally(() => {
        if (!cancelled) setActivityLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markAllRead = () => {
    setStoredReadIds(allIds);
    setActivity((prev) => prev.map((n) => ({ ...n, read: true })));
    setActivityUnread(0);
    ApiClient.post("/api/notifications/read").catch(() => {});
  };

  const openBell = () => {
    setTab("activity");
    refreshActivity().then(() => markAllRead());
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    setTab(dx < 0 ? "whatsnew" : "activity");
  };

  const toggleDesktop = () => {
    if (!dropdownOpen) openBell();
    setDropdownOpen((v) => !v);
  };

  const openMobile = () => {
    openBell();
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

  const activitySection =
    activityLoaded && activity.length === 0 ? (
      <p className="px-3 py-2.5 text-xs text-zinc-400">No activity yet.</p>
    ) : (
      <ul className="space-y-1">
        {activity.map((n) => (
          <ActivityItem key={n.id} n={n} />
        ))}
      </ul>
    );

  const systemSection = (
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
          title="Notifications"
          size="sm"
        >
          <NotificationTabs tab={tab} onChange={setTab} />
          <div
            className="mt-3 max-h-[60vh] overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {tab === "activity" ? activitySection : systemSection}
          </div>
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
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 z-50 mt-1 w-80 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl p-2 animate-dropdown">
          <NotificationTabs tab={tab} onChange={setTab} />
          <div className="mt-2 max-h-72 overflow-y-auto">
            {tab === "activity" ? activitySection : systemSection}
          </div>
        </div>
      )}
    </div>
  );
}
