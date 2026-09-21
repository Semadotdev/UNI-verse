import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, ariaLabel, disabled, className }: ToggleProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </button>
      {label && <span className="text-xs text-muted">{label}</span>}
    </span>
  );
}
