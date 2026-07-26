interface UNIverseLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function UNIverseLogo({ size = 32, className = "", showText = false }: UNIverseLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/Universe-logo.png"
        alt="UNI-verse"
        width={size}
        height={size}
        className="shrink-0 rounded-sm"
      />
      {showText && (
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">UNI</span>
          <span className="text-[#A78BFA]">-</span>
          <span className="text-white">verse</span>
        </span>
      )}
    </div>
  );
}
