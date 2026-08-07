import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SegmentedControlProps {
  options: { value: string; label: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex rounded-lg bg-bg-overlay border border-border p-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
            value === option.value
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:text-zinc-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
