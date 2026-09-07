import { ApiClient } from "@/lib/api-client";
import type { Page } from "@/domain/entities/page";

export function buildPageImageUrl(page: Page, retryCount: number): string {
  if (page.direct) return page.url;
  const base = ApiClient.imageUrl(page.url, page.headers);
  if (retryCount > 0) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}r=${retryCount}`;
  }
  return base;
}