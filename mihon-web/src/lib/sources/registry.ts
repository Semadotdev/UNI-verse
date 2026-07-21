import { SourceAdapter } from "./types";
import { MangaDexSource } from "./mangadex";
import { MangaSeeSource } from "./mangasee";
import { GenericScraperSource } from "./generic-scraper";
import { KeiyoushiExtension } from "./keiyoushi";

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

export function registerDynamicSources(extensions: KeiyoushiExtension[]): void {
  for (const ext of extensions) {
    for (const source of ext.sources) {
      const id = `keiyoushi-${source.id}`;
      if (!sources.has(id)) {
        const scraper = new GenericScraperSource(
          id,
          source.name,
          source.baseUrl,
          `${ext.name} - ${source.name} (${ext.lang})`
        );
        sources.set(id, scraper);
      }
    }
  }
}

export function unregisterDynamicSources(): void {
  const dynamicIds = Array.from(sources.keys()).filter((id) =>
    id.startsWith("keiyoushi-")
  );
  for (const id of dynamicIds) {
    sources.delete(id);
  }
}

// Initialize built-in sources
registerSource(new MangaDexSource());
registerSource(new MangaSeeSource());
