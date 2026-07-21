"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  /** Lucide-compatible icon element */
  icon?: ReactNode;
  /** Bold heading */
  title: string;
  /** Description text below the heading */
  description?: string;
  /** Optional CTA button label */
  actionLabel?: string;
  /** Called when the CTA button is clicked */
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-zinc-800/60 p-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
