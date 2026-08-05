"use client";

import { cn } from "@/lib/utils";

export function PostImageGrid({ images }: { images: { url: string }[] }) {
  const count = images.length;
  if (count === 0) return null;

  const cols = count === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={cn("grid gap-2", cols)}>
      {images.map((img, i) => (
        <img
          key={img.url}
          src={img.url}
          alt=""
          className={cn(
            "w-full h-auto rounded-lg object-cover bg-bg-raised",
            count === 1 && "max-h-[420px]",
            count === 3 && i === 0 && "row-span-2 h-full"
          )}
          loading="lazy"
        />
      ))}
    </div>
  );
}
