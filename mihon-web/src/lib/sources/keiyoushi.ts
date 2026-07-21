const INDEX_URL = "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json";

export interface KeiyoushiExtension {
  name: string;
  pkg: string;
  apk: string;
  lang: string;
  code: number;
  version: string;
  nsfw: number;
  sources: Array<{
    name: string;
    lang: string;
    id: string;
    baseUrl: string;
  }>;
}

let cache: KeiyoushiExtension[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchExtensions(): Promise<KeiyoushiExtension[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  const res = await fetch(INDEX_URL, {
    headers: { "User-Agent": "MihonWeb/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Keiyoushi index: ${res.status}`);
  }

  cache = await res.json();
  cacheTime = Date.now();
  return cache!;
}

export function searchExtensions(
  extensions: KeiyoushiExtension[],
  query: string,
  lang?: string,
  nsfw?: boolean
): KeiyoushiExtension[] {
  let results = extensions;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.sources.some((s) => s.name.toLowerCase().includes(q))
    );
  }

  if (lang) {
    results = results.filter((ext) => ext.lang === lang);
  }

  if (!nsfw) {
    results = results.filter((ext) => ext.nsfw === 0);
  }

  return results;
}

export function getLanguages(extensions: KeiyoushiExtension[]): string[] {
  const langs = new Set(extensions.map((e) => e.lang));
  return Array.from(langs).sort();
}

const INSTALLED_KEY = "mihon-installed-extensions";

export function getInstalledExtensions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(INSTALLED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function installExtension(pkg: string): void {
  const installed = getInstalledExtensions();
  if (!installed.includes(pkg)) {
    installed.push(pkg);
    localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed));
  }
}

export function uninstallExtension(pkg: string): void {
  const installed = getInstalledExtensions().filter((p) => p !== pkg);
  localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed));
}

export function isExtensionInstalled(pkg: string): boolean {
  return getInstalledExtensions().includes(pkg);
}
