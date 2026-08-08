"use client";

import { useEffect, useRef, useState } from "react";
import { REACTIONS, type ReactionType } from "@/domain/constants/reactions";

interface ReactionPickerProps {
  current: ReactionType | null;
  onPick: (type: ReactionType) => void;
  children: React.ReactNode;
}

const HOVER_DELAY_MS = 200;
const HOLD_DELAY_MS = 400;

export function ReactionPicker({ current, onPick, children }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const scheduleOpen = (delay: number) => {
    clearClose();
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), delay);
  };

  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  const clearTimers = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handlePointerDown = () => {
    clearClose();
    holdTimer.current = setTimeout(() => setOpen(true), HOLD_DELAY_MS);
  };

  const handlePointerUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const pick = (type: ReactionType) => {
    onPick(type);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => scheduleOpen(HOVER_DELAY_MS)}
      onMouseLeave={scheduleClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {children}
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 flex items-center gap-0.5 rounded-full border border-border bg-bg-raised px-2 py-1.5 shadow-lg z-20"
          onMouseEnter={clearClose}
          onMouseLeave={scheduleClose}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              title={r.label}
              onClick={() => pick(r.type)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-125 ${
                current === r.type ? "bg-primary/15" : ""
              }`}
            >
              <span aria-hidden>{r.emoji}</span>
              <span className="sr-only">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
