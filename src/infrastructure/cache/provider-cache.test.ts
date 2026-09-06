import { describe, expect, it, vi, beforeEach } from "vitest";

const { findUniqueMock, updateMock, createMock, deleteManyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  createMock: vi.fn(),
  deleteManyMock: vi.fn(),
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    providerCache: {
      findUnique: findUniqueMock,
      update: updateMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },
  },
}));

import { getOrFetch } from "./provider-cache";

const NOW = new Date("2026-09-06T00:00:00Z");
const FUTURE = new Date("2026-09-06T06:00:00Z");
const PAST = new Date("2026-09-05T00:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

describe("getOrFetch", () => {
  it("returns fresh fetched data when no cached row exists", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});

    const result = await getOrFetch("webtoons", "det:m1", 60000, async () => ({
      id: "m1",
      lastUpdate: new Date("2026-01-01T00:00:00Z"),
    }));

    expect(result).toEqual({ id: "m1", lastUpdate: new Date("2026-01-01T00:00:00Z") });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { providerId_cacheKey: { providerId: "webtoons", cacheKey: "det:m1" } },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        providerId: "webtoons",
        cacheKey: "det:m1",
        expiresAt: new Date(NOW.getTime() + 60000),
      }),
    });
  });

  it("skips the fetcher when a valid cached row exists and revives Dates", async () => {
    findUniqueMock.mockResolvedValue({
      id: "c1",
      providerId: "webtoons",
      cacheKey: "det:m1",
      payload: { id: "m1", lastUpdate: { $date: "2026-01-01T00:00:00.000Z" } },
      fetchedAt: NOW,
      expiresAt: FUTURE,
    });

    const fetchFn = vi.fn().mockRejectedValue(new Error("should not be called"));
    const result = await getOrFetch("webtoons", "det:m1", 60000, fetchFn);

    expect(fetchFn).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "m1", lastUpdate: new Date("2026-01-01T00:00:00.000Z") });
  });

  it("refetches when the cached row has expired", async () => {
    findUniqueMock.mockResolvedValue({
      id: "c1",
      providerId: "webtoons",
      cacheKey: "det:m1",
      payload: { id: "old" },
      fetchedAt: PAST,
      expiresAt: PAST,
    });
    updateMock.mockResolvedValue({});

    const result = await getOrFetch("webtoons", "det:m1", 60000, async () => ({ id: "fresh" }));

    expect(result).toEqual({ id: "fresh" });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent calls into a single upstream fetch", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});

    let calls = 0;
    const fetchFn = async () => {
      calls++;
      return { id: "m1" };
    };

    const [a, b, c] = await Promise.all([
      getOrFetch("webtoons", "det:m1", 60000, fetchFn),
      getOrFetch("webtoons", "det:m1", 60000, fetchFn),
      getOrFetch("webtoons", "det:m1", 60000, fetchFn),
    ]);

    expect(a).toEqual({ id: "m1" });
    expect(b).toEqual({ id: "m1" });
    expect(c).toEqual({ id: "m1" });
    expect(calls).toBe(1);
  });

  it("propagates errors from the fetcher without caching", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      getOrFetch("webtoons", "det:m1", 60000, async () => {
        throw new Error("upstream down");
      })
    ).rejects.toThrow("upstream down");

    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});