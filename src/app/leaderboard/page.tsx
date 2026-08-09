"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  count: number;
}

type BoardType = "posts" | "readers";

const MEDALS: Record<number, { label: string; className: string }> = {
  1: { label: "🥇", className: "text-amber-300" },
  2: { label: "🥈", className: "text-zinc-300" },
  3: { label: "🥉", className: "text-amber-600" },
};

export default function LeaderboardPage() {
  const [type, setType] = useState<BoardType>("posts");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ApiClient.get<{ type: BoardType; entries: LeaderboardEntry[] }>(
      `/api/leaderboard?type=${type}&limit=20`
    )
      .then((res) => {
        if (!cancelled) setEntries(res.entries);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const handleTypeChange = (v: string) => {
    setLoading(true);
    setType(v as BoardType);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
      <h1 className="text-xl font-bold text-zinc-100 mb-5">Leaderboard</h1>

      <SegmentedControl
        className="mb-5"
        value={type}
        onChange={handleTypeChange}
        options={[
          { value: "posts", label: "Top Posters" },
          { value: "readers", label: "Top Readers" },
        ]}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-bg-overlay border border-border animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">No rankings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const medal = MEDALS[entry.rank];
            const displayName = entry.name || entry.username || "Anonymous";
            return (
              <Link
                key={entry.userId}
                href={entry.username ? `/profile/${entry.username}` : "/profile"}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-overlay border border-border hover:border-primary/50 transition-all"
              >
                <span className={`w-8 text-center text-lg font-bold ${medal?.className ?? "text-muted"}`}>
                  {medal?.label ?? entry.rank}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-border bg-bg-raised">
                  {entry.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-100">{displayName}</span>
                  {entry.username && (
                    <span className="block truncate text-xs text-muted">@{entry.username}</span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-primary-light">{entry.count}</span>
                  <span className="block text-[10px] text-muted uppercase tracking-wider">
                    {type === "posts" ? (entry.count === 1 ? "post" : "posts") : "manga"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
