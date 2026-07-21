import { SearchResult } from "@/lib/sources/types";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  manga: SearchResult[];
  sourceId: string;
}

export function MangaGrid({ manga, sourceId }: MangaGridProps) {
  if (manga.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <p className="text-lg">No manga found</p>
        <p className="text-sm">Try a different search or source</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {manga.map((item) => (
        <MangaCard key={`${sourceId}-${item.id}`} manga={item} sourceId={sourceId} />
      ))}
    </div>
  );
}
