import { describe, expect, it } from "vitest";
import { clusterPageComments } from "./pin-clustering";
import type { PageComment } from "@/domain/entities/page-comment";

function makeComment(overrides: Partial<PageComment> = {}): PageComment {
  return {
    id: "c1",
    body: "hello",
    author: { username: "alice", name: null, avatarUrl: null },
    canDelete: false,
    parentId: null,
    replies: [],
    pageIndex: 0,
    pageY: 0.5,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("clusterPageComments", () => {
  it("returns one cluster per distinct pageY when far apart", () => {
    const comments = [
      makeComment({ id: "c1", pageIndex: 0, pageY: 0.1 }),
      makeComment({ id: "c2", pageIndex: 0, pageY: 0.5 }),
      makeComment({ id: "c3", pageIndex: 0, pageY: 0.9 }),
    ];
    const clusters = clusterPageComments(comments);
    expect(clusters).toHaveLength(3);
    expect(clusters.map((c) => c.comments)).toEqual([
      [comments[0]],
      [comments[1]],
      [comments[2]],
    ]);
  });

  it("merges comments within tolerance into one cluster", () => {
    const comments = [
      makeComment({ id: "c1", pageIndex: 0, pageY: 0.50 }),
      makeComment({ id: "c2", pageIndex: 0, pageY: 0.52 }),
      makeComment({ id: "c3", pageIndex: 0, pageY: 0.48 }),
    ];
    const clusters = clusterPageComments(comments);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].comments).toHaveLength(3);
  });

  it("groups comments by pageIndex", () => {
    const comments = [
      makeComment({ id: "c1", pageIndex: 0, pageY: 0.5 }),
      makeComment({ id: "c2", pageIndex: 1, pageY: 0.5 }),
    ];
    const clusters = clusterPageComments(comments);
    expect(clusters).toHaveLength(2);
  });

  it("returns empty array for no comments", () => {
    expect(clusterPageComments([])).toEqual([]);
  });

  it("sorts clusters by pageY ascending", () => {
    const comments = [
      makeComment({ id: "c1", pageIndex: 0, pageY: 0.9 }),
      makeComment({ id: "c2", pageIndex: 0, pageY: 0.1 }),
    ];
    const clusters = clusterPageComments(comments);
    expect(clusters[0].pageY).toBeLessThan(clusters[1].pageY);
  });

  it("uses average pageY of cluster members for cluster position", () => {
    const comments = [
      makeComment({ id: "c1", pageIndex: 0, pageY: 0.48 }),
      makeComment({ id: "c2", pageIndex: 0, pageY: 0.52 }),
    ];
    const clusters = clusterPageComments(comments);
    expect(clusters[0].pageY).toBeCloseTo(0.50);
  });
});