"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { ReportsList } from "@/components/admin/ReportsList";
import { StatsOverview } from "@/components/admin/StatsOverview";

type Tab = "overview" | "reports";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    ApiClient.get<{ role: string }>("/api/me")
      .then((me) => setAuthorized(me.role === "admin"))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <p className="text-sm text-muted">Checking access...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <p className="text-sm text-red-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-10">
      <h1 className="text-xl font-bold text-zinc-100 mb-5">Admin</h1>

      <div className="flex gap-2 mb-5">
        {(["overview", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg border border-border transition-colors ${
              tab === t ? "bg-primary/15 text-primary border-primary/30" : "text-muted hover:text-zinc-200"
            }`}
          >
            {t === "overview" ? "Overview" : "Reports"}
          </button>
        ))}
      </div>

      {tab === "overview" ? <StatsOverview /> : <ReportsList />}
    </div>
  );
}
