"use client";

interface PageCommentPinProps {
  count: number;
  pageY: number;
  onClick: () => void;
}

export function PageCommentPin({ count, pageY, onClick }: PageCommentPinProps) {
  const topPct = pageY * 100;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-1 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-primary/80 backdrop-blur-sm text-white text-[11px] font-semibold shadow-lg hover:bg-primary transition-colors"
      style={{ top: `${topPct}%`, transform: "translateY(-50%)" }}
      title={count > 0 ? `${count} comment${count === 1 ? "" : "s"}` : "Add comment"}
    >
      {count > 0 ? count : "+"}
    </button>
  );
}
