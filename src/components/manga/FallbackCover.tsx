interface FallbackCoverProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function FallbackCover({ size = "md", className = "" }: FallbackCoverProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-bg-overlay ${className}`}>
      <svg
        className={`${sizeClasses[size]} text-muted-foreground/30`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    </div>
  );
}
