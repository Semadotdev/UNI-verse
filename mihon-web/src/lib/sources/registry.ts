import { SourceAdapter } from "./types";
import { MangaDexSource } from "./mangadex";
import { MangaSeeSource } from "./mangasee";
import { MangaKakalotScraper, MangaNatoScraper, AsuraScansScraper, ComickScraper, MangaFireScraper } from "./scrapers";

const sources: Map<string, SourceAdapter> = new Map();

export function registerSource(source: SourceAdapter): void {
  sources.set(source.id, source);
}

export function getSource(id: string): SourceAdapter | undefined {
  return sources.get(id);
}

export function getAllSources(): SourceAdapter[] {
  return Array.from(sources.values());
}

export function getEnabledSources(): SourceAdapter[] {
  return Array.from(sources.values()).filter((s) => s.enabled);
}

// Initialize built-in sources
registerSource(new MangaDexSource());
registerSource(new MangaSeeSource());
registerSource(new MangaKakalotScraper());
registerSource(new MangaNatoScraper());
registerSource(new AsuraScansScraper());
registerSource(new ComickScraper());
registerSource(new MangaFireScraper());
