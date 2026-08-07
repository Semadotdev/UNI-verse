import { describe, expect, it } from "vitest";
import { buildFeedWhere } from "./post-feed-where";

const base = {
  username: undefined,
  authorId: undefined,
  feed: undefined as "all" | "friends" | "nsfw" | undefined,
  viewerIsAdult: true,
  viewerShowNsfw: true,
  friendIds: [],
};

describe("buildFeedWhere", () => {
  it("does not filter nsfw for adults on the default feed", () => {
    const where = buildFeedWhere(base);
    expect(where).not.toHaveProperty("nsfw");
  });

  it("hides nsfw for minors on the default feed", () => {
    const where = buildFeedWhere({ ...base, viewerIsAdult: false, viewerShowNsfw: true });
    expect(where.nsfw).toBe(false);
  });

  it("hides nsfw for adults who opted out on the default feed", () => {
    const where = buildFeedWhere({ ...base, viewerIsAdult: true, viewerShowNsfw: false });
    expect(where.nsfw).toBe(false);
  });

  it("filters to friends on the friends feed", () => {
    const where = buildFeedWhere({ ...base, feed: "friends", friendIds: ["u2", "u3"] });
    expect(where.authorId).toEqual({ in: ["u2", "u3"] });
  });

  it("keeps nsfw visible for adults on the friends feed", () => {
    const where = buildFeedWhere({ ...base, feed: "friends", friendIds: ["u2"] });
    expect(where).not.toHaveProperty("nsfw");
  });

  it("hides nsfw for minors on the friends feed", () => {
    const where = buildFeedWhere({ ...base, feed: "friends", friendIds: ["u2"], viewerIsAdult: false, viewerShowNsfw: true });
    expect(where.nsfw).toBe(false);
    expect(where.authorId).toEqual({ in: ["u2"] });
  });

  it("only nsfw posts for adults on the nsfw feed", () => {
    const where = buildFeedWhere({ ...base, feed: "nsfw" });
    expect(where.nsfw).toBe(true);
  });

  it("forces an empty result for minors on the nsfw feed", () => {
    const where = buildFeedWhere({ ...base, feed: "nsfw", viewerIsAdult: false, viewerShowNsfw: true });
    expect(where.nsfw).toBe(true);
    expect(where.id).toEqual({ in: [] });
  });

  it("scopes to authorId when a username is provided", () => {
    const where = buildFeedWhere({ ...base, username: "alice", authorId: "u9" });
    expect(where.authorId).toBe("u9");
  });
});
