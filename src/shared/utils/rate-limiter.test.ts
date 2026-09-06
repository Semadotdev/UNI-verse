import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter, resetRateLimiter } from "./rate-limiter";

const { upsertMock, deleteManyMock, findUniqueMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  deleteManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    rateLimitBucket: {
      upsert: upsertMock,
      deleteMany: deleteManyMock,
      findUnique: findUniqueMock,
    },
  },
}));

describe("RateLimiter (in-memory fast path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000_000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("allows the first request and starts a new bucket without touching the DB", async () => {
    const limiter = new RateLimiter(60_000, 5);
    const result = await limiter.isAllowed("test:x");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(result.resetAt).toBe(1_000_020_000);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("counts subsequent requests in the same window", async () => {
    const limiter = new RateLimiter(60_000, 5);
    await limiter.isAllowed("test:x");
    await limiter.isAllowed("test:x");
    await limiter.isAllowed("test:x");

    const result = await limiter.isAllowed("test:x");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("blocks once the limit is reached", async () => {
    const limiter = new RateLimiter(60_000, 5);
    for (let i = 0; i < 5; i++) {
      await limiter.isAllowed("test:x");
    }
    const result = await limiter.isAllowed("test:x");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets the count when the window elapses", async () => {
    const limiter = new RateLimiter(60_000, 5);
    for (let i = 0; i < 6; i++) {
      await limiter.isAllowed("test:x");
    }
    expect((await limiter.isAllowed("test:x")).allowed).toBe(false);

    vi.setSystemTime(1_000_060_001);
    const result = await limiter.isAllowed("test:x");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("returns remaining from the in-memory bucket", async () => {
    const limiter = new RateLimiter(60_000, 5);
    await limiter.isAllowed("test:x");
    await limiter.isAllowed("test:x");
    expect(await limiter.getRemaining("test:x")).toBe(3);
  });

  it("occasionally syncs the in-memory bucket to the DB and prunes stale buckets", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.001);
    upsertMock.mockResolvedValue({});
    deleteManyMock.mockResolvedValue({ count: 0 });

    const limiter = new RateLimiter(60_000, 5);
    const result = await limiter.isAllowed("test:x");

    expect(result.allowed).toBe(true);
    expect(upsertMock).toHaveBeenCalledWith({
      where: { key: "test:x:16666" },
      create: { key: "test:x:16666", count: 1, resetAt: new Date(1_000_020_000) },
      update: { count: 1 },
    });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { resetAt: { lt: new Date(1_000_000_000) } },
    });
  });
});