import { describe, expect, it } from "vitest";
import { isNsfwCategories, NSFW_CATEGORIES } from "./nsfw-genres";

describe("isNsfwCategories", () => {
  it("returns true when any category is nsfw", () => {
    expect(isNsfwCategories(["Action", "Ecchi"])).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isNsfwCategories(["ADULT"])).toBe(true);
    expect(isNsfwCategories(["hentai"])).toBe(true);
  });

  it("returns false for non-nsfw categories", () => {
    expect(isNsfwCategories(["Action", "Romance", "Drama"])).toBe(false);
  });

  it("returns false for empty categories", () => {
    expect(isNsfwCategories([])).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isNsfwCategories([" Smut "])).toBe(true);
  });

  it("exposes the canonical nsfw set", () => {
    expect(NSFW_CATEGORIES).toContain("yaoi");
    expect(NSFW_CATEGORIES).toContain("yuri");
  });
});
