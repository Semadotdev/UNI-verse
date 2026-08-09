import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_ID,
  getProfileTheme,
  isDefaultTheme,
  PROFILE_THEMES,
  resolveProfileTheme,
} from "./profile-themes";

describe("profile-themes catalog", () => {
  it("contains a free default theme and priced themes", () => {
    expect(getProfileTheme(DEFAULT_THEME_ID)?.price).toBe(0);
    expect(PROFILE_THEMES.length).toBeGreaterThan(1);
    expect(PROFILE_THEMES.every((t) => t.price >= 0)).toBe(true);
  });

  it("resolves unknown ids to the default theme", () => {
    expect(resolveProfileTheme("nope").id).toBe(DEFAULT_THEME_ID);
    expect(resolveProfileTheme(null).id).toBe(DEFAULT_THEME_ID);
  });

  it("returns undefined for unknown ids on strict lookup", () => {
    expect(getProfileTheme("nope")).toBeUndefined();
  });

  it("isDefaultTheme matches only the default id", () => {
    expect(isDefaultTheme(DEFAULT_THEME_ID)).toBe(true);
    expect(isDefaultTheme("sunset")).toBe(false);
  });
});

describe("animated theme catalog", () => {
  const ANIMATED_KINDS = ["aurora", "stardust", "embers", "waves", "neon", "matrix"];
  const STATIC_IDS = ["default", "sunset", "ocean", "midnight", "neon"];

  it("includes at least one animated theme", () => {
    expect(PROFILE_THEMES.some((t) => t.animation)).toBe(true);
  });

  it("marks every animated theme with a valid kind and keeps static themes animation-free", () => {
    for (const t of PROFILE_THEMES) {
      if (t.animation) {
        expect(ANIMATED_KINDS).toContain(t.animation.kind);
      } else {
        expect(STATIC_IDS).toContain(t.id);
      }
    }
  });

  it("prices every animated theme in the premium tier", () => {
    for (const t of PROFILE_THEMES) {
      if (t.animation) expect(t.price).toBeGreaterThanOrEqual(150);
    }
  });

  it("keeps ids unique across the whole catalog", () => {
    const ids = PROFILE_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the default theme free and static", () => {
    const def = getProfileTheme(DEFAULT_THEME_ID);
    expect(def?.price).toBe(0);
    expect(def?.animation).toBeUndefined();
  });

  it("gives every animated theme valid config", () => {
    for (const t of PROFILE_THEMES) {
      const a = t.animation;
      if (!a) continue;
      if (a.kind === "aurora") expect(a.blobs.length).toBeGreaterThan(0);
      if (a.kind === "stardust") expect(a.starCount).toBeGreaterThan(0);
      if (a.kind === "embers") expect(a.emberCount).toBeGreaterThan(0);
      if (a.kind === "waves") expect(a.layers.length).toBeGreaterThan(0);
      if (a.kind === "neon") expect(a.duration).toBeGreaterThan(0);
      if (a.kind === "matrix") expect(a.columnCount).toBeGreaterThan(0);
    }
  });
});
