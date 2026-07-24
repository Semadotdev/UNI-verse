"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm md:max-w-md lg:max-w-lg bg-bg-raised border-l border-border shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-zinc-200 hover:bg-bg-overlay transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-3.25rem)] p-4 scrollbar-none">
          {children}
        </div>
      </div>
    </>
  );
}
