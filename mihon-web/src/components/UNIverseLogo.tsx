interface UNIverseLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function UNIverseLogo({ size = 32, className = "", showText = false }: UNIverseLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="moonGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M44 12C36.3 12 29.6 16.2 25.8 22.4C22 28.6 21 36.2 23.2 43.2C25.4 50.2 30.6 55.8 37.2 58.4C33.6 59.6 29.6 59.6 26 58.4C18.4 55.6 13.2 48.4 12 40C10.8 31.6 13.2 23.2 18.6 16.8C24 10.4 31.6 6.4 39.6 6.4C43.2 6.4 46.6 7.2 49.8 8.8C48 9.6 46 10.8 44 12Z"
          fill="url(#moonGradient)"
          filter="url(#moonGlow)"
        />
        <path
          d="M38 18C32.4 18 27.2 21.2 24.4 26C21.6 30.8 21 36.4 22.8 41.6C24.6 46.8 28.6 51 33.6 53C31.2 53.6 28.6 53.4 26.2 52.4C20.4 50 16.2 44.8 15.2 38.8C14.2 32.8 15.8 26.6 19.6 21.8C23.4 17 28.8 14 34.6 13.6C35.6 13.6 36.8 13.6 38 14V18Z"
          fill="#09090b"
        />
        <circle cx="50" cy="18" r="2" fill="#A78BFA" opacity="0.8" />
        <circle cx="54" cy="26" r="1.2" fill="#A78BFA" opacity="0.5" />
        <circle cx="48" cy="30" r="1" fill="#C4B5FD" opacity="0.4" />
        <path d="M8 28L14 26" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M6 36L12 35" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>
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
