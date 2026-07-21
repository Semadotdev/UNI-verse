export interface MangaWebsite {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  icon: string; // emoji
  lang: string;
  hasSearch: boolean;
  searchUrl: (query: string) => string; // URL to redirect user for search
  category: "aggregator" | "scanlation" | "raw";
}

export const MANGA_WEBSITES: MangaWebsite[] = [
  {
    id: "mangadex",
    name: "MangaDex",
    baseUrl: "https://mangadex.org",
    description: "Multi-language manga aggregator with a huge library",
    icon: "🌐",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://mangadex.org/search?q=${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "mangakakalot",
    name: "MangaKakalot",
    baseUrl: "https://mangakakalot.com",
    description: "English manga reading site with large collection",
    icon: "📚",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://mangakakalot.com/search/story/${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "manganato",
    name: "MangaNato",
    baseUrl: "https://manganato.com",
    description: "Manga reading platform with daily updates",
    icon: "📖",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://manganato.com/search/story/${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "asurascans",
    name: "Asura Scans",
    baseUrl: "https://asurascans.com",
    description: "Popular scanlation group with manhwa and manhua",
    icon: "⚔️",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://asurascans.com/?s=${encodeURIComponent(q)}&post_type=wp-manga`,
    category: "scanlation",
  },
  {
    id: "reaperscans",
    name: "Reaper Scans",
    baseUrl: "https://reaperscans.com",
    description: "Scanlation group focusing on manhwa",
    icon: "💀",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://reaperscans.com/?s=${encodeURIComponent(q)}&post_type=wp-manga`,
    category: "scanlation",
  },
  {
    id: "comick",
    name: "Comick",
    baseUrl: "https://comick.io",
    description: "Modern manga reading platform with API",
    icon: "🎯",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://comick.io/search?q=${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "mangafire",
    name: "MangaFire",
    baseUrl: "https://mangafire.to",
    description: "Manga reading site with anime tracking",
    icon: "🔥",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://mangafire.to/filter?keyword=${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "chapmanganato",
    name: "ChapManganato",
    baseUrl: "https://chapmanganato.to",
    description: "Manga reading with fast updates",
    icon: "📑",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://chapmanganato.to/search/story/${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "mangabuddy",
    name: "MangaBuddy",
    baseUrl: "https://mangabuddy.com",
    description: "Clean manga reading experience",
    icon: "🤝",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://mangabuddy.com/search?q=${encodeURIComponent(q)}`,
    category: "aggregator",
  },
  {
    id: "1stkissmanga",
    name: "1stKissManga",
    baseUrl: "https://1st kissmanga.me",
    description: "Manga and manhwa collection",
    icon: "💋",
    lang: "en",
    hasSearch: true,
    searchUrl: (q) => `https://1st kissmanga.me/search?q=${encodeURIComponent(q)}`,
    category: "aggregator",
  },
];

export function getWebsiteById(id: string): MangaWebsite | undefined {
  return MANGA_WEBSITES.find((w) => w.id === id);
}

export function getWebsitesByCategory(category: MangaWebsite["category"]): MangaWebsite[] {
  return MANGA_WEBSITES.filter((w) => w.category === category);
}

const FAVOURITES_KEY = "mihon-favourite-websites";

export function getFavouriteWebsites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addFavouriteWebsite(id: string): void {
  const favs = getFavouriteWebsites();
  if (!favs.includes(id)) {
    favs.push(id);
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
  }
}

export function removeFavouriteWebsite(id: string): void {
  const favs = getFavouriteWebsites().filter((f) => f !== id);
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
}

export function isFavouriteWebsite(id: string): boolean {
  return getFavouriteWebsites().includes(id);
}
