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
