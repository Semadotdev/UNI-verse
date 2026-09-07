import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "@/lib/api-client";
import {
  claimChapterReward,
  flushRewardQueue,
  hasLocalClaim,
  pendingJobCount,
} from "./reward-queue";

function createLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  } as Storage;
}

let storage: Storage;
let postSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  storage = createLocalStorage();
  vi.stubGlobal("localStorage", storage);
  postSpy = vi.spyOn(ApiClient, "post").mockResolvedValue({ rewarded: true, balance: 1 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const claim = (chapterId = "ch-1") =>
  claimChapterReward({
    providerId: "p",
    mangaId: "m",
    chapterId,
    chapterNum: 1,
    title: "Chapter 1",
    coverUrl: "https://cover/x.jpg",
  });

describe("claimChapterReward", () => {
  it("returns shown=true and queues a job on first claim", () => {
    expect(claim().shown).toBe(true);
    expect(pendingJobCount()).toBe(1);
    expect(hasLocalClaim("p", "m", "ch-1")).toBe(true);
  });

  it("returns shown=false and does not duplicate a job on re-claim", () => {
    expect(claim().shown).toBe(true);
    expect(claim().shown).toBe(false);
    expect(pendingJobCount()).toBe(1);
  });

  it("capped at 50 queued jobs", () => {
    for (let i = 0; i < 60; i++) claim(`ch-${i}`);
    expect(pendingJobCount()).toBe(50);
  });

  it("still returns shown=true when localStorage writes fail", async () => {
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(claim().shown).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("flushRewardQueue", () => {
  it("removes the job after a successful reward post", async () => {
    claim();
    await flushRewardQueue();
    expect(pendingJobCount()).toBe(0);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it("removes the job when the server reports already rewarded", async () => {
    postSpy.mockResolvedValue({ rewarded: false });
    claim();
    await flushRewardQueue();
    expect(pendingJobCount()).toBe(0);
  });

  it("keeps the job when the post fails", async () => {
    postSpy.mockRejectedValue(new Error("Network down"));
    claim();
    await flushRewardQueue();
    expect(pendingJobCount()).toBe(1);
    expect(postSpy).toHaveBeenCalledWith(
      "/api/history",
      expect.objectContaining({ completed: true, progress: 100 }),
      expect.objectContaining({ keepalive: true })
    );
  });
});