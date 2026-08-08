"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { timeAgo } from "@/shared/utils/time";
import type { AdminStats } from "@/application/services/admin.service";

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg-raised p-4">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-primary-light" : "text-zinc-100"}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

export function StatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.get<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) return <p className="text-sm text-muted">Loading stats...</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Posts" value={stats.totalPosts} />
        <StatCard label="Comments" value={stats.totalComments} />
        <StatCard label="Likes" value={stats.totalLikes} />
        <StatCard label="Library entries" value={stats.libraryEntries} />
        <StatCard label="Pending reports" value={stats.pendingReports} accent={stats.pendingReports > 0} />
        <StatCard label="Providers" value={stats.providersEnabled} />
        <StatCard label="New users today" value={stats.newUsersToday} />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Today&apos;s activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="New users" value={stats.newUsersToday} />
          <StatCard label="New posts" value={stats.postsToday} />
          <StatCard label="New comments" value={stats.commentsToday} />
          <StatCard label="Providers enabled" value={`${stats.providersEnabled}/${stats.providersTotal}`} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Recent signups</h2>
        {stats.recentUsers.length === 0 && <p className="text-sm text-muted py-6 text-center">No users yet.</p>}
        <div className="space-y-2">
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-raised px-4 py-2.5">
              <span className="text-sm text-zinc-300 truncate">{u.username ?? u.name ?? "Unknown"}</span>
              <span className="text-xs text-muted shrink-0">{timeAgo(u.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
