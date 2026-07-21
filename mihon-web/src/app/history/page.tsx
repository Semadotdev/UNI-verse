"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { Clock } from "lucide-react";

interface HistoryItem {
  id: string;
  mangaId: string;
  sourceId: string;
  chapterId: string;
  chapterNum: number | null;
  readAt: string;
  progress: number | null;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <h1 className="mb-6 text-2xl font-bold">Reading History</h1>

      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => (
            <Link
              key={item.id}
              href={`/read/${item.sourceId}/${item.mangaId}/${item.chapterId}`}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-500" />
                <div>
                  <p className="font-medium">Chapter {item.chapterNum || "?"}</p>
                  <p className="text-sm text-zinc-400">{item.sourceId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">
                  {new Date(item.readAt).toLocaleDateString()}
                </p>
                {item.progress !== null && (
                  <p className="text-xs text-zinc-500">
                    {Math.round(item.progress * 100)}%
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-zinc-500">
          No reading history yet. Start reading to track your progress!
        </p>
      )}
    </div>
  );
}
