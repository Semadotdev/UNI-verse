import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCachedPost,
  invalidatePostCache,
  resetPostCache,
  setCachedPost,
} from "./post-cache";

beforeEach(() => {
  resetPostCache();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("post-cache", () => {
  it("returns the stored value", () => {
    setCachedPost("p1", { post: "row", reactionGroups: [] });
    expect(getCachedPost("p1")).toEqual({ post: "row", reactionGroups: [] });
  });

  it("expires entries after the TTL", () => {
    setCachedPost("p1", 1);
    vi.advanceTimersByTime(31_000);
    expect(getCachedPost("p1")).toBeUndefined();
  });

  it("does not expire entries before the TTL", () => {
    setCachedPost("p1", 1);
    vi.advanceTimersByTime(29_000);
    expect(getCachedPost("p1")).toBe(1);
  });

  it("invalidates a specific key", () => {
    setCachedPost("p1", 1);
    setCachedPost("p2", 2);
    invalidatePostCache("p1");
    expect(getCachedPost("p1")).toBeUndefined();
    expect(getCachedPost("p2")).toBe(2);
  });

  it("evicts the oldest entry when the cache exceeds its cap", () => {
    for (let i = 0; i < 501; i += 1) {
      setCachedPost(`p${i}`, i);
    }
    expect(getCachedPost("p0")).toBeUndefined();
    expect(getCachedPost("p500")).toBe(500);
  });

  it("returns undefined for keys that were never set", () => {
    expect(getCachedPost("missing")).toBeUndefined();
  });
});