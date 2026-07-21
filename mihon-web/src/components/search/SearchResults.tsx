import { MangaGrid } from "@/components/manga/MangaGrid";

interface SourceResults {
  source: string;
  sourceName: string;
  items: any[];
}

interface SearchResultsProps {
  results: SourceResults[];
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="space-y-8">
      {results.map((source) => (
        <section key={source.source}>
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">
            {source.sourceName}
          </h3>
          {source.items.length > 0 ? (
            <MangaGrid manga={source.items} sourceId={source.source} />
          ) : (
            <p className="text-zinc-500">No results from this source</p>
          )}
        </section>
      ))}
    </div>
  );
}
