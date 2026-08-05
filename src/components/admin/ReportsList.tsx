"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { timeAgo } from "@/shared/utils/time";
import type { AdminReportItem } from "@/application/services/report.service";

export function ReportsList() {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "post" | "comment">("all");
  const { addToast } = useToast();

  const load = async (p: number) => {
    const res = await ApiClient.getWithMeta<AdminReportItem[]>(`/api/admin/reports?page=${p}&limit=20`);
    setReports(res.data);
    setHasMore(Boolean(res.meta?.hasMore));
    setPage(p);
  };

  useEffect(() => {
    load(1).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = tab === "all" ? reports : reports.filter((r) => r.type === tab);

  const remove = async (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const deleteContent = async (item: AdminReportItem) => {
    try {
      if (item.type === "post") {
        await ApiClient.delete<{ deleted: boolean }>(`/api/posts/${item.contentId}`);
      } else {
        await ApiClient.delete<{ deleted: boolean }>(`/api/comments/${item.contentId}`);
      }
      addToast(`${item.type === "post" ? "Post" : "Comment"} deleted`, "success");
      await remove(item.id);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to delete content", "error");
    }
  };

  const dismiss = async (item: AdminReportItem) => {
    try {
      await ApiClient.post<{ dismissed: boolean }>(`/api/admin/reports/${item.id}?type=${item.type}`);
      addToast("Report dismissed", "success");
      await remove(item.id);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to dismiss report", "error");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["all", "post", "comment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg border border-border transition-colors ${
              tab === t ? "bg-primary/15 text-primary border-primary/30" : "text-muted hover:text-zinc-200"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading reports...</p>}

      {!loading && visible.length === 0 && (
        <p className="text-sm text-muted py-10 text-center">No reports.</p>
      )}

      <div className="space-y-3">
        {visible.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-bg-raised p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/15 text-primary shrink-0">
                  {item.type}
                </span>
                <span className="text-xs text-muted truncate">
                  by {item.reporter.username ?? item.reporter.name ?? "Unknown"} · {timeAgo(item.createdAt)}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => deleteContent(item)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  Delete content
                </button>
                <button
                  onClick={() => dismiss(item)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-border text-muted hover:text-zinc-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{item.content}</p>
            {item.reason && (
              <p className="mt-1 text-xs text-muted">Reason: {item.reason}</p>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => load(page + 1)}
          className="w-full py-2.5 text-sm text-primary hover:text-primary-light transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  );
}
