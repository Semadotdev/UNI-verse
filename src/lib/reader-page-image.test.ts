import { describe, expect, it } from "vitest";
import { buildPageImageUrl } from "./reader-page-image";
import type { Page } from "@/domain/entities/page";

describe("buildPageImageUrl", () => {
  it("uses the proxy URL without a retry param by default", () => {
    const url = buildPageImageUrl({ index: 0, url: "https://cdn.example.com/a.jpg" }, 0);
    expect(url.startsWith("/api/image?url=")).toBe(true);
    expect(url).not.toContain("r=");
  });

  it("appends a cache-busting retry param for proxied pages", () => {
    const url = buildPageImageUrl({ index: 0, url: "https://cdn.example.com/a.jpg" }, 2);
    expect(url).toContain("r=2");
  });

  it("returns the direct URL untouched for direct pages", () => {
    const page: Page = { index: 0, url: "https://cdn.example.com/a.jpg", direct: true };
    expect(buildPageImageUrl(page, 3)).toBe("https://cdn.example.com/a.jpg");
  });
});