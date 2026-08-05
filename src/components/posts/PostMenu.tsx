"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface PostMenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

export function PostMenu({ items }: { items: PostMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-colors"
        aria-label="More options"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-40 rounded-xl border border-border bg-bg-raised shadow-lg py-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                item.danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-300 hover:bg-bg-overlay"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
