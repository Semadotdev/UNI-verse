const PROXY_PATH = "/api/image";

/**
 * Build a proxied image URL that routes through the `/api/image` endpoint.
 * This centralises the encode-then-prefix pattern used across all components
 * that display images from remote sources.
 *
 * @param url - The original remote image URL.
 * @returns A string like `/api/image?url=<encoded>`.
 */
export function buildProxiedUrl(url: string): string {
  return `${PROXY_PATH}?url=${encodeURIComponent(url)}`;
}

/**
 * Safe wrapper around {@link buildProxiedUrl} that handles `null` / `undefined`
 * inputs gracefully, returning an empty string so callers never produce an
 * invalid `<img>` source.
 *
 * @param url - The original remote image URL, or `null` / `undefined`.
 * @returns A valid proxy URL, or an empty string when the input is missing.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (url == null || url === "") return "";
  return buildProxiedUrl(url);
}
