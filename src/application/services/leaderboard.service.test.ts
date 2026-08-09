import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    post: { groupBy: vi.fn() },
    readingHistory: { groupBy: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));

import { LeaderboardService } from "./leaderboard.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeaderboardService.getTopPosters", () => {
  it("ranks users by post count and joins their profiles", async () => {
    prisma.post.groupBy.mockResolvedValue([
      { authorId: "u1", _count: { authorId: 3 } },
      { authorId: "u2", _count: { authorId: 1 } },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { id: "u1", username: "alice", name: "Alice", avatarUrl: "https://a.example/1.png" },
      { id: "u2", username: "bob", name: null, avatarUrl: null },
    ]);

    const entries = await new LeaderboardService().getTopPosters(10);

    expect(prisma.post.groupBy).toHaveBeenCalledWith({
      by: ["authorId"],
      _count: { authorId: true },
      orderBy: { _count: { authorId: "desc" } },
      take: 10,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["u1", "u2"] } },
      select: { id: true, username: true, name: true, avatarUrl: true },
    });
    expect(entries).toEqual([
      { rank: 1, userId: "u1", username: "alice", name: "Alice", avatarUrl: "https://a.example/1.png", count: 3 },
      { rank: 2, userId: "u2", username: "bob", name: null, avatarUrl: null, count: 1 },
    ]);
  });

  it("drops rows whose user profile no longer exists", async () => {
    prisma.post.groupBy.mockResolvedValue([
      { authorId: "u1", _count: { authorId: 2 } },
      { authorId: "ghost", _count: { authorId: 1 } },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { id: "u1", username: "alice", name: "Alice", avatarUrl: null },
    ]);

    const entries = await new LeaderboardService().getTopPosters(10);

    expect(entries).toEqual([
      { rank: 1, userId: "u1", username: "alice", name: "Alice", avatarUrl: null, count: 2 },
    ]);
  });
});

describe("LeaderboardService.getTopReaders", () => {
  it("ranks users by distinct manga read and joins their profiles", async () => {
    prisma.readingHistory.groupBy.mockResolvedValue([
      { userId: "u2", _count: { userId: 7 } },
      { userId: "u1", _count: { userId: 2 } },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { id: "u1", username: "alice", name: "Alice", avatarUrl: null },
      { id: "u2", username: "bob", name: "Bob", avatarUrl: "https://b.example/2.png" },
    ]);

    const entries = await new LeaderboardService().getTopReaders(10);

    expect(prisma.readingHistory.groupBy).toHaveBeenCalledWith({
      by: ["userId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    });
    expect(entries).toEqual([
      { rank: 1, userId: "u2", username: "bob", name: "Bob", avatarUrl: "https://b.example/2.png", count: 7 },
      { rank: 2, userId: "u1", username: "alice", name: "Alice", avatarUrl: null, count: 2 },
    ]);
  });
});
