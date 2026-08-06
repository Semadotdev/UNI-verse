export const NSFW_CATEGORIES = [
  "adult",
  "ecchi",
  "hentai",
  "mature",
  "ntr",
  "smut",
  "yaoi",
  "yuri",
] as const;

export function isNsfwCategories(categories: string[]): boolean {
  const set = new Set<string>(NSFW_CATEGORIES);
  return categories.some((category) => set.has(category.trim().toLowerCase()));
}
