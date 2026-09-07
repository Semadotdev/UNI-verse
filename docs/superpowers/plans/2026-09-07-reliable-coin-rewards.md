# Reliable Coin Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the coin notification immediately on chapter completion and guarantee the coin credit is processed in a durable background queue.

**Architecture:** A localStorage-backed reward queue (`src/lib/reward-queue.ts`) with a claimed-chapter set. The reader synchronously marks the claim and fires an optimistic toast; the queue flushes `POST /api/history` jobs in the background with retry-on-failure (single-flight, keepalive). Server-side reward stays idempotent.

**Tech Stack:** React 19 + Next.js 16 client components, vitest (node env).

---

### Task 1: Reward queue module + tests

**Files:**
- Create: `src/lib/reward-queue.ts`
- Test: `src/lib/reward-queue.test.ts`

- [ ] **Step 1: Write `src/lib/reward-queue.ts`**

```ts
import { ApiClient } from "@/lib/api-client";

const QUEUE_KEY = "reward-queue:v1";
const CLAIMED_KEY = "reward-claimed:v1";
const MAX_QUEUE_SIZE = 50;
const MAX_CLAIMED_SIZE = 500;

export interface RewardJob {
  key: string;
  providerId: string;
  mangaId: string;
  chapterId: string;
  chapterNum: number;
  title?: string;
  coverUrl?: string;
  progress: number;
  completed: boolean;
}

export interface RewardClaim {
  shown: boolean;
}

function chapterKey(providerId: string, mangaId: string, chapterId: string): string {
  return `${providerId}/${mangaId}/${chapterId}`;
}

function readJobs(): RewardJob[] {
  try {
    const raw = globalThis.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RewardJob[]) : [];
  } catch {
    return [];
  }
}

function persistJobs(jobs: RewardJob[]): boolean {
  try {
    globalThis.localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
    return true;
  } catch {
    return false;
  }
}

function removeJob(key: string): void {
  persistJobs(readJobs().filter((j) => j.key !== key));
}

function readClaims(): string[] {
  try {
    const raw = globalThis.localStorage.getItem(CLAIMED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function persistClaims(claims: string[]): boolean {
  try {
    globalThis.localStorage.setItem(CLAIMED_KEY, JSON.stringify(claims.slice(-MAX_CLAIMED_SIZE)));
    return true;
  } catch {
    return false;
  }
}

export function hasLocalClaim(providerId: string, mangaId: string, chapterId: string): boolean {
  return readClaims().includes(chapterKey(providerId, mangaId, chapterId));
}

export function markLocalClaim(providerId: string, mangaId: string, chapterId: string): void {
  const key = chapterKey(providerId, mangaId, chapterId);
  if (!readClaims().includes(key)) {
    const claims = readClaims();
    claims.push(key);
    persistClaims(claims);
  }
}

export function pendingJobCount(): number {
  return readJobs().length;
}

let flushing = false;

export async function flushRewardQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (const job of readJobs()) {
      try {
        await ApiClient.post<{ rewarded?: boolean; balance?: number }>(
          "/api/history",
          {
            providerId: job.providerId,
            mangaId: job.mangaId,
            chapterId: job.chapterId,
            chapterNum: job.chapterNum,
            title: job.title,
            coverUrl: job.coverUrl,
            progress: job.progress,
            completed: job.completed,
          },
          { keepalive: true }
        );
        removeJob(job.key);
      } catch {
        // transient failure — keep the job queued for a later flush
      }
    }
  } finally {
    flushing = false;
  }
}

function fireAndForget(job: RewardJob): void {
  void ApiClient.post<{ rewarded?: boolean; balance?: number }>(
    "/api/history",
    {
      providerId: job.providerId,
      mangaId: job.mangaId,
      chapterId: job.chapterId,
      chapterNum: job.chapterNum,
      title: job.title,
      coverUrl: job.coverUrl,
      progress: job.progress,
      completed: job.completed,
    },
    { keepalive: true }
  ).catch(() => {});
}

export function claimChapterReward(details: {
  providerId: string;
  mangaId: string;
  chapterId: string;
  chapterNum: number;
  title?: string;
  coverUrl?: string;
}): RewardClaim {
  if (hasLocalClaim(details.providerId, details.mangaId, details.chapterId)) {
    return { shown: false };
  }
  markLocalClaim(details.providerId, details.mangaId, details.chapterId);

  const job: RewardJob = { ...details, key: chapterKey(details.providerId, details.mangaId, details.chapterId), progress: 100, completed: true };

  const jobs = readJobs();
  if (!jobs.some((j) => j.key === job.key)) {
    jobs.push(job);
    if (!persistJobs(jobs.slice(-MAX_QUEUE_SIZE))) {
      fireAndForget(job);
    }
  }

  void flushRewardQueue();
  return { shown: true };
}

export function registerRewardFlusher(): () => void {
  const flush = () => {
    void flushRewardQueue();
  };
  flush();
  window.addEventListener("online", flush);
  const onVisibility = () => {
    if (document.visibilityState === "visible") flush();
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
```

- [ ] **Step 2: Write `src/lib/reward-queue.test.ts`**

```ts
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

  it("returns shown=false and does not duplicate a job on re-claim", async () => {
    claim();
    await Promise.resolve();
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
```

Note: the "re-claim" test awaits a microtask because `claimChapterReward` fires `flushRewardQueue()` without awaiting; the microtask lets the flush's `flushing` guard settle and complete so the second claim isn't racing a removal.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/reward-queue.test.ts`
Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/reward-queue.ts src/lib/reward-queue.test.ts
git commit -m "feat: add durable background reward queue"
```

---

### Task 2: Register the flusher app-wide

**Files:**
- Modify: `src/components/Providers.tsx`

- [ ] **Step 1: Update imports and mount the flusher**

```tsx
import { ReactNode, useEffect } from "react";
...
import { registerRewardFlusher } from "@/lib/reward-queue";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    return registerRewardFlusher();
  }, []);

  return ( ...existing JSX unchanged... );
}
```

Keep all existing providers in the same nesting order.

- [ ] **Step 2: Verify** — `npx tsc --noEmit`; `npm run lint` (same baseline errors only)
- [ ] **Step 3: Commit**

```bash
git add src/components/Providers.tsx
git commit -m "feat: flush pending reward queue on app load, online, and visibility"
```

---

### Task 3: Optimistic reward claim in the reader

**Files:**
- Modify: `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`

- [ ] **Step 1: Import the claim helper**

Add `import { claimChapterReward } from "@/lib/reward-queue";` alongside the existing `@/lib/reader-progress` import.

- [ ] **Step 2: Replace the completion branch of the progress effect**

Existing (lines ~99-131): the effect defines `postProgress(keepalive)` whose `.then` shows the toast, and the `completed` branch calls `postProgress(true)`.

Replace the whole effect body with:

```tsx
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionPostedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentChapter || !mangaDetails || pages.length === 0) return;
    const { progress, completed } = computeReaderProgress(currentPage, pages.length);

    if (completed) {
      if (completionPostedForRef.current === chapterId) return;
      completionPostedForRef.current = chapterId;
      const { shown } = claimChapterReward({
        providerId,
        mangaId,
        chapterId,
        chapterNum: currentChapter.number,
        title: mangaDetails.title,
        coverUrl: mangaDetails.cover,
      });
      if (shown) addToast("You earned a coin!", "success");
      return;
    }

    const postProgress = () => {
      ApiClient.post("/api/history", {
        providerId,
        mangaId,
        chapterId,
        chapterNum: currentChapter.number,
        title: mangaDetails.title,
        coverUrl: mangaDetails.cover,
        progress,
        completed: false,
      }).catch(() => {});
    };
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(postProgress, 2000);
    return () => { if (progressTimer.current) clearTimeout(progressTimer.current); };
  }, [currentPage, pages.length, currentChapter, mangaDetails, providerId, mangaId, chapterId, addToast]);
```

`ApiClient` remains used (non-completed progress posts). The reward toast no longer waits on a round-trip.

- [ ] **Step 3: Verify** — `npx tsc --noEmit`
- [ ] **Step 4: Commit**

```bash
git add "src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx"
git commit -m "feat: optimistic coin toast with background completion claim"
```

---

### Task 4: Full verification

- [ ] **Step 1:** `npm test` — all suites pass (18 files, previous 107 + new reward-queue tests)
- [ ] **Step 2:** `npm run lint` (same 18 pre-existing baseline errors only) and `npx tsc --noEmit`
- [ ] **Step 3:** Commit any remaining changes if uncommitted.
- [ ] **Step 4:** Manual: devtools offline while completing a chapter → toast appears; tab reload/reconnect → coin credited once.