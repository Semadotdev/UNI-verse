import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "./rate-limiter";

const { upsertMock, countMock, deleteManyMock, findUniqueMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  countMock: vi.fn(),
  deleteManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    rateLimitBucket: {
      upsert: upsertMock,
      count: countMock,
      deleteMany: deleteManyMock,
      findUnique: findUniqueMock,
    },
    $transaction: async (queries: unknown[]) => {
      const results = [];
      for (const q of queries) {
        results.push(await (q as Promise<unknown>));
      }
      return results;
    },
  },
}));

describe("RateLimiter (DB-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.01);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows the first request and starts a new bucket", async () => {
    const now = 1_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);
    upsertMock.mockResolvedValue({ key: "test:x:1", count: 1, resetAt: new Date(now + 60_000) });
    countMock.mockResolvedValue(0);

    const limiter = new RateLimiter(60_000, 5);
    const result = await limiter.isAllowed("test:x");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(result.resetAt).toBe(1_000_020_000);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "test:x:16666" },
        create: expect.objectContaining({ key: "test:x:16666", count: 1 }),
        update: expect.objectContaining({ count: { increment: 1 } }),
      })
    );
    vi.useRealTimers();
  });

  it("blocks once the limit is reached", async () => {
    const now = 1_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);
    upsertMock.mockResolvedValue({ key: "test:x:16666", count: 6, resetAt: new Date(1_000_020_000) });
    countMock.mockResolvedValue(0);

    const limiter = new RateLimiter(60_000, 5);
    const result = await limiter.isAllowed("test:x");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    vi.useRealTimers();
  });

  it("leaves remaining requests on a partially used bucket", async () => {
    upsertMock.mockResolvedValue({ key: "test:x:16", count: 3, resetAt: new Date(Date.now() + 60_000) });
    countMock.mockResolvedValue(0);

    const limiter = new RateLimiter(60_000, 10);
    const result = await limiter.isAllowed("test:x");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it("prunes stale buckets with some probability", async () => {
    upsertMock.mockResolvedValue({ key: "test:x:16", count: 1, resetAt: new Date(Date.now() + 60_000) });
    countMock.mockResolvedValue(3);

    const limiter = new RateLimiter(60_000, 5);
    await limiter.isAllowed("test:x");

    expect(deleteManyMock).toHaveBeenCalled();
  });

  it("does not prune when there are no stale buckets", async () => {
    upsertMock.mockResolvedValue({ key: "test:x:16", count: 1, resetAt: new Date(Date.now() + 60_000) });
    countMock.mockResolvedValue(0);

    const limiter = new RateLimiter(60_000, 5);
    await limiter.isAllowed("test:x");

    expect(deleteManyMock).not.toHaveBeenCalled();
  });
});
