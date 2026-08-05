"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PostLightbox } from "@/components/posts/PostLightbox";

export function PostImageGrid({ images }: { images: { url: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  const cols = count === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <>
      <div className={cn("grid gap-2", cols)}>
        {images.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setOpenIndex(i)}
            className={cn(
              "group relative block w-full h-auto rounded-lg overflow-hidden bg-bg-raised focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-zoom-in",
              count === 1 && "max-h-[70vh]",
              count === 3 && i === 0 && "row-span-2 h-full"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <img
              src={img.url}
              alt=""
              className={cn(
                "w-full h-auto group-hover:opacity-95 transition-opacity",
                count === 1 ? "max-h-[70vh] object-contain" : "object-cover",
                count === 3 && i === 0 && "row-span-2 h-full"
              )}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <PostLightbox
          images={images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
