import { cn } from "@/lib/utils";

export function NsfwBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full leading-none",
        className
      )}
    >
      18+
    </span>
  );
}
