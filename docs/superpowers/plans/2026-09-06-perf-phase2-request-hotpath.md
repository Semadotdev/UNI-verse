# Performance Phase 2 — Request Hotpath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the fixed per-request overhead (middleware Supabase auth on `/api/*`, DB rate-limit transaction, per-request user upsert) and add an in-memory L1 + on-disk image cache so landlord requests fall to ~single-digit milliseconds, and fix `/api/posts` + `/api/library/folders` returning 500 (instead of 401) when unauthenticated.

**Architecture:**
- Middleware short-circuits `/api/*` before any Supabase network call (route handlers already authenticate themselves).
- `getAuthUserId` throws a canonical `UnauthorizedError` (message `'Unauthorized'`) for any auth failure and replaces the per-request `prisma.user.upsert` with an in-process `knownUsers` set + lean `findUnique` + create-once fallback.
- `RateLimiter` becomes in-memory-first (Map keyed by window bucket) with a best-effort, probabilistic Postgres sync — the common path never touches the DB.
- Provider cache gains an in-memory L1 (60s TTL, 500-entry LRU-ish eviction) in front of the Postgres L2.
- Image proxy gains an on-disk cache (SHA-256 keyed by URL + headers, 7-day TTL, 500-file cap, sidecar JSON for content type) before the upstream fetch.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Prisma 7 (adapter-pg), Supabase (auth + remote Postgres at `aws-0-ap-southeast-1.pooler.supabase.com`), vitest 4, Node 20/26.

---

### Task 1: Middleware — skip Supabase auth for `/api/*` routes

**Files:**
- Create: `src/middleware.test.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Write the failing test**

Create `src/middleware.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("next/server", () => ({
  NextResponse: {
    next: (): { kind: string } => ({ kind: "next" }),
    redirect: (url: URL): { kind: string; url: URL } => ({ kind: "redirect", url }),
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

import { middleware } from "./middleware";

function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname },
    cookies: { getAll: () => [], set: () => {} },
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("skips Supabase getUser for API routes", async () => {
    const res = await middleware(makeRequest("/api/posts?page=1"));
    expect(getUserMock).not.toHaveBeenCalled();
    expect(res.kind).toBe("next");
  });

  it("runs getUser for public page routes", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest("/login"));
    expect(getUserMock).toHaveBeenCalled();
    expect(res.kind).toBe("next");
  });

  it("redirects unauthenticated users on protected pages", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest("/home"));
    expect(res.kind).toBe("redirect");
    expect((res as { url: URL }).url.pathname).toBe("/login");
  });

  it("redirects authenticated users away from public routes", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await middleware(makeRequest("/login"));
    expect(res.kind).toBe("redirect");
    expect((res as { url: URL }).url.pathname).toBe("/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/middleware.test.ts`
Expected: FAIL — the API-route test calls the current middleware, which reaches `supabase.auth.getUser()` (mocked to return `{ data: { user: null } }`), so `getUserMock` IS called and the assertion `not.toHaveBeenCalled()` fails. (The other three may individually pass.)

- [ ] **Step 3: Implement the middleware short-circuit**

Replace the body of `src/middleware.ts` with:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/api/auth'];
const alwaysPublicRoutes = ['/legal', '/s'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAlwaysPublic = alwaysPublicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isApiRoute) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) =>
            response.cookies.set(name, value, options as Record<string, unknown>)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute && !isAlwaysPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute && !isAlwaysPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

Note: the `isApiRoute` checks in the two redirect conditions are removed because `/api/*` already returned early at the top. Auth semantics are unchanged — API routes were never redirected before.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/middleware.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "perf: skip Supabase auth in middleware for API routes"
```

---

### Task 2: `getAuthUserId` — canonical UnauthorizedError + drop per-request upsert

**Files:**
- Create: `src/lib/auth.test.ts`
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));
const { findUniqueMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

import { getAuthUserId, resetKnownUsers, UnauthorizedError } from "./auth";

describe("getAuthUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKnownUsers();
  });

  it("throws UnauthorizedError when the session has no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "missing" } });

    await expect(getAuthUserId()).rejects.toThrow(UnauthorizedError);
    await expect(getAuthUserId()).rejects.toMatchObject({ name: "UnauthorizedError" });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("wraps a thrown Supabase error into UnauthorizedError", async () => {
    getUserMock.mockRejectedValue(new Error("Network request failed"));

    await expect(getAuthUserId()).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Unauthorized",
    });
  });

  it("returns the user id for a known user without a DB round trip on repeat calls", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c", user_metadata: {} } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({ id: "u1" });

    await expect(getAuthUserId()).resolves.toBe("u1");
    await expect(getAuthUserId()).resolves.toBe("u1");

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a user row when the auth user has no local row", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u2",
          email: "new@x.co",
          user_metadata: { username: "newuser", name: "New User" },
        },
      },
      error: null,
    });
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: "u2" });

    await expect(getAuthUserId()).resolves.toBe("u2");
    expect(createMock).toHaveBeenCalledWith({
      data: {
        id: "u2",
        email: "new@x.co",
        username: "newuser",
        name: "New User",
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL — `resetKnownUsers` and `UnauthorizedError` are not exported yet; `getAuthUserId` still calls `prisma.user.upsert` (not mocked) so the known-user test errors.

- [ ] **Step 3: Implement the new getAuthUserId**

Replace the entire contents of `src/lib/auth.ts` with:

```ts
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/infrastructure/database/prisma-client';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

const knownUsers = new Set<string>();

export function resetKnownUsers(): void {
  knownUsers.clear();
}

export async function getAuthUserId(): Promise<string> {
  const supabase = await getSupabaseServerClient();

  let user: { id: string; email: string | null; user_metadata: Record<string, unknown> };

  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    if (error || !authUser) {
      throw new UnauthorizedError();
    }
    user = authUser as { id: string; email: string | null; user_metadata: Record<string, unknown> };
  } catch (origin) {
    if (origin instanceof UnauthorizedError) {
      throw origin;
    }
    throw new UnauthorizedError();
  }

  if (knownUsers.has(user.id)) {
    return user.id;
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true },
  });

  if (existing) {
    knownUsers.add(user.id);
    return user.id;
  }

  await prisma.user.create({
    data: {
      id: user.id,
      email: user.email ?? '',
      username: (user.user_metadata?.username as string | undefined) ?? user.email?.split('@')[0] ?? '',
      name: (user.user_metadata?.name as string | undefined) ?? user.email?.split('@')[0] ?? '',
    },
  });
  knownUsers.add(user.id);

  return user.id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Verify 401-vs-500 behavior is unchanged for callers**

Run: `npm run typecheck`
Expected: PASS — callers (`src/app/api/posts/route.ts:28`, `src/app/api/library/folders/route.ts`) check `error.message === 'Unauthorized'`, which `UnauthorizedError` preserves, so both still map unauthenticated sessions to 401. A raw Supabase network error is now normalized to `'Unauthorized'` (was: `500` on posts/folders).

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "perf: harden getAuthUserId auth errors and drop per-request upsert"
```

---

### Task 3: Rate limiter — in-memory fast path with best-effort DB sync

**Files:**
- Modify: `src/shared/utils/rate-limiter.ts` (full rewrite)
- Test: `src/shared/utils/rate-limiter.test.ts` (full rewrite)

- [ ] **Step 1: Replace the test file**

Overwrite `src/shared/utils/rate-limiter.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/utils/rate-limiter.test.ts`
Expected: FAIL — `resetRateLimiter` is not exported; the old implementation makes every `isAllowed` hit `prisma.$transaction` (unmocked → crashes).

- [ ] **Step 3: Implement the in-memory RateLimiter**

Overwrite `src/shared/utils/rate-limiter.ts` with:

```ts
import { prisma } from '@/infrastructure/database/prisma-client';

const PRUNE_PROBABILITY = 0.05;
const SYNC_PROBABILITY = 0.01;
const MAX_MEMORY_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface MemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

export function resetRateLimiter(): void {
  memoryBuckets.clear();
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async isAllowed(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const resetAt = (Math.floor(now / this.windowMs) + 1) * this.windowMs;

    let bucket = memoryBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt };
      memoryBuckets.set(bucketKey, bucket);
      if (memoryBuckets.size > MAX_MEMORY_KEYS) {
        const oldest = memoryBuckets.keys().next().value;
        if (oldest !== undefined) {
          memoryBuckets.delete(oldest);
        }
      }
    }
    bucket.count += 1;

    if (Math.random() < SYNC_PROBABILITY) {
      await this.syncToDb(bucketKey, bucket);
    }

    const remaining = Math.max(0, this.maxRequests - bucket.count);
    return {
      allowed: bucket.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      resetAt,
    };
  }

  private async syncToDb(bucketKey: string, bucket: MemoryBucket): Promise<void> {
    try {
      await prisma.rateLimitBucket.upsert({
        where: { key: bucketKey },
        create: { key: bucketKey, count: bucket.count, resetAt: new Date(bucket.resetAt) },
        update: { count: bucket.count },
      });
      if (Math.random() < PRUNE_PROBABILITY) {
        await prisma.rateLimitBucket.deleteMany({
          where: { resetAt: { lt: new Date() } },
        });
      }
    } catch {
      // best effort
    }
  }

  async getRemaining(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = memoryBuckets.get(bucketKey);
    if (bucket && bucket.resetAt > now) {
      return Math.max(0, this.maxRequests - bucket.count);
    }
    const dbBucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!dbBucket) return this.maxRequests;
    return Math.max(0, this.maxRequests - dbBucket.count);
  }

  async getResetMs(key: string): Promise<number> {
    const now = Date.now();
    const bucketKey = `${key}:${Math.floor(now / this.windowMs)}`;
    const bucket = memoryBuckets.get(bucketKey);
    if (bucket && bucket.resetAt > now) {
      return Math.max(0, bucket.resetAt - now);
    }
    const dbBucket = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
    if (!dbBucket) return 0;
    return Math.max(0, dbBucket.resetAt.getTime() - now);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/utils/rate-limiter.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/rate-limiter.ts src/shared/utils/rate-limiter.test.ts
git commit -m "perf: make rate limiter in-memory with best-effort DB sync"
```

---

### Task 4: Provider cache — in-memory L1 layer

**Files:**
- Modify: `src/infrastructure/cache/provider-cache.ts`
- Test: `src/infrastructure/cache/provider-cache.test.ts`

- [ ] **Step 1: Write the failing L1 tests and update existing test setup**

Overwrite `src/infrastructure/cache/provider-cache.test.ts` with:

```ts
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

import { getOrFetch, resetProviderCache } from "./provider-cache";

const NOW = new Date("2026-09-06T00:00:00Z");
const FUTURE = new Date("2026-09-06T06:00:00Z");
const PAST = new Date("2026-09-05T00:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  resetProviderCache();
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

    const fetchFn = vi.fn().mockResolvedValue({ id: "new" });
    const result = await getOrFetch("webtoons", "det:m1", 60000, fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "new" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        payload: { id: "new" },
        expiresAt: new Date(NOW.getTime() + 60000),
      }),
    });
  });

  it("coalesces concurrent fetches for the same key", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});

    let calls = 0;
    const fetchFn = vi.fn(async () => {
      calls++;
      return { id: "m1" };
    });

    const [a, b] = await Promise.all([
      getOrFetch("webtoons", "det:m1", 60000, fetchFn),
      getOrFetch("webtoons", "det:m1", 60000, fetchFn),
    ]);

    expect(a).toEqual({ id: "m1" });
    expect(b).toEqual({ id: "m1" });
    expect(calls).toBe(1);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("propagates fetcher errors without caching", async () => {
    findUniqueMock.mockResolvedValue(null);
    const fetchFn = vi.fn().mockRejectedValue(new Error("upstream down"));

    await expect(getOrFetch("webtoons", "det:m1", 60000, fetchFn)).rejects.toThrow("upstream down");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("serves a second read from the in-memory L1 cache without touching the DB", async () => {
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});
    const fetchFn = vi.fn().mockResolvedValue({ id: "m1" });

    const first = await getOrFetch("webtoons", "det:m1", 60000, fetchFn);
    const second = await getOrFetch("webtoons", "det:m1", 60000, fetchFn);

    expect(first).toEqual({ id: "m1" });
    expect(second).toEqual({ id: "m1" });
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("refetches from the DB once the L1 window has elapsed", async () => {
    findUniqueMock.mockResolvedValue({
      id: "c1",
      providerId: "webtoons",
      cacheKey: "det:m1",
      payload: { id: "old" },
      fetchedAt: NOW,
      expiresAt: FUTURE,
    });

    await getOrFetch("webtoons", "det:m1", 60000, vi.fn().mockRejectedValue(new Error("no fetch")));

    vi.setSystemTime(new Date(NOW.getTime() + 120_000));
    findUniqueMock.mockResolvedValue({
      id: "c1",
      providerId: "webtoons",
      cacheKey: "det:m1",
      payload: { id: "fresh" },
      fetchedAt: NOW,
      expiresAt: FUTURE,
    });

    const result = await getOrFetch("webtoons", "det:m1", 60000, vi.fn().mockRejectedValue(new Error("no fetch")));

    expect(result).toEqual({ id: "fresh" });
    expect(findUniqueMock).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/infrastructure/cache/provider-cache.test.ts`
Expected: FAIL — `resetProviderCache` not exported; "serves a second read from the L1 cache" fails (the DB is hit twice per current implementation).

- [ ] **Step 3: Implement the L1 layer**

Modify `src/infrastructure/cache/provider-cache.ts`:

- Add module-level L1 state and helpers after the `inflight` map (line ~21):

```ts
const L1_TTL_MS = 60 * 1000;
const L1_MAX_ENTRIES = 500;
const l1Cache = new Map<string, { value: unknown; expiresAt: number }>();

export function resetProviderCache(): void {
  l1Cache.clear();
}

function getL1(key: string): unknown | undefined {
  const entry = l1Cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    l1Cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setL1(key: string, value: unknown): void {
  if (l1Cache.size >= L1_MAX_ENTRIES) {
    const oldest = l1Cache.keys().next().value;
    if (oldest !== undefined) {
      l1Cache.delete(oldest);
    }
  }
  l1Cache.set(key, { value, expiresAt: Date.now() + L1_TTL_MS });
}
```

- Replace the top of `getOrFetch` (the `const now = new Date();` block through the DB-hit check) with:

```ts
  const now = new Date();
  const l1Key = `${providerId}:${cacheKey}`;

  const l1Value = getL1(l1Key);
  if (l1Value !== undefined) {
    return l1Value as T;
  }

  const existing = await prisma.providerCache.findUnique({
    where: { providerId_cacheKey: { providerId, cacheKey } },
  });

  if (existing && new Date(existing.expiresAt) > now) {
    const value = deserialize<T>(existing.payload);
    setL1(l1Key, value);
    return value;
  }
```

- Replace the inflight fetch block (current lines ~75-109) so the L1 is populated on fetch success and the `inflightKey` variable is removed in favor of `l1Key`:

```ts
  const pending = inflight.get(l1Key);
  if (pending) {
    return (await pending) as T;
  }

  const fetchPromise = (async () => {
    const value = await fetcher();
    setL1(l1Key, value);
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      if (existing) {
        await prisma.providerCache.update({
          where: { id: existing.id },
          data: { payload: serialize(value), fetchedAt: now, expiresAt },
        });
      } else {
        await prisma.providerCache.create({
          data: { providerId, cacheKey, payload: serialize(value), fetchedAt: now, expiresAt },
        });
        void maybeSweep();
      }
    } catch (error) {
      logger.warn(`Failed to persist provider cache ${l1Key}`, error);
    }

    return value;
  })();

  inflight.set(l1Key, fetchPromise);
  try {
    return (await fetchPromise) as T;
  } finally {
    inflight.delete(l1Key);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/infrastructure/cache/provider-cache.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/cache/provider-cache.ts src/infrastructure/cache/provider-cache.test.ts
git commit -m "perf: add in-memory L1 layer to provider cache"
```

---

### Task 5: Image proxy — on-disk cache

**Files:**
- Create: `src/infrastructure/proxy/image-cache.ts`
- Create: `src/infrastructure/proxy/image-cache.test.ts`
- Create: `src/infrastructure/proxy/image-proxy.test.ts`
- Modify: `src/infrastructure/proxy/image-proxy.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing disk-cache test**

Create `src/infrastructure/proxy/image-cache.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getCachedImage, setCachedImage } from "./image-cache";

describe("image-cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "imgcache-"));
    process.env.IMAGE_CACHE_DIR = dir;
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
    delete process.env.IMAGE_CACHE_DIR;
  });

  it("returns undefined when nothing is cached", async () => {
    expect(await getCachedImage("https://x.com/a.webp")).toBeUndefined();
  });

  it("stores and returns a cached image with its content type", async () => {
    const buffer = Buffer.from([0x12, 0x34, 0x56]);
    await setCachedImage("https://x.com/a.webp", undefined, buffer, "image/webp");

    const cached = await getCachedImage("https://x.com/a.webp");
    expect(cached).toBeDefined();
    expect(cached!.contentType).toBe("image/webp");
    expect(Buffer.compare(cached!.buffer, buffer)).toBe(0);
  });

  it("distinguishes entries by url and headers", async () => {
    const plain = Buffer.from([1]);
    const withReferer = Buffer.from([2]);
    await setCachedImage("https://x.com/a.webp", undefined, plain, "image/webp");
    await setCachedImage("https://x.com/a.webp", { Referer: "https://x.com/" }, withReferer, "image/webp");

    const hitPlain = await getCachedImage("https://x.com/a.webp");
    const hitReferer = await getCachedImage("https://x.com/a.webp", { Referer: "https://x.com/" });

    expect(Buffer.compare(hitPlain!.buffer, plain)).toBe(0);
    expect(Buffer.compare(hitReferer!.buffer, withReferer)).toBe(0);
  });
});
```

- [ ] **Step 2: Write the failing image-proxy test**

Create `src/infrastructure/proxy/image-proxy.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { getCachedImageMock, setCachedImageMock } = vi.hoisted(() => ({
  getCachedImageMock: vi.fn(),
  setCachedImageMock: vi.fn(),
}));

vi.mock("@/infrastructure/proxy/image-cache", () => ({
  getCachedImage: getCachedImageMock,
  setCachedImage: setCachedImageMock,
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

import { proxyImage } from "./image-proxy";

describe("proxyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves a cached image without hitting the upstream", async () => {
    getCachedImageMock.mockResolvedValue({ buffer: Buffer.from([9, 9]), contentType: "image/webp" });

    const result = await proxyImage("https://x.com/a.webp");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.contentType).toBe("image/webp");
    expect(result.cacheControl).toContain("immutable");

    const reader = result.stream.getReader();
    const { value } = await reader.read();
    expect(Array.from(value!)).toEqual([9, 9]);
  });

  it("fetches upstream on a miss and stores the result on disk", async () => {
    getCachedImageMock.mockResolvedValue(undefined);
    setCachedImageMock.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "image/webp" }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });

    const result = await proxyImage("https://x.com/a.webp");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setCachedImageMock).toHaveBeenCalledWith(
      "https://x.com/a.webp",
      undefined,
      Buffer.from([1, 2, 3]),
      "image/webp"
    );
    expect(result.contentType).toBe("image/webp");

    const reader = result.stream.getReader();
    const { value } = await reader.read();
    expect(Array.from(value!)).toEqual([1, 2, 3]);
  });

  it("throws on blocked content types", async () => {
    getCachedImageMock.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "text/html" }),
      arrayBuffer: async () => new Uint8Array(0).buffer,
    });

    await expect(proxyImage("https://x.com/a")).rejects.toThrow("Blocked content type");
    expect(setCachedImageMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npx vitest run src/infrastructure/proxy/image-cache.test.ts src/infrastructure/proxy/image-proxy.test.ts`
Expected: FAIL — `image-cache.ts` doesn't exist (import error); `proxyImage` currently streams `response.body` and never consults the disk cache.

- [ ] **Step 4: Implement the disk cache module**

Create `src/infrastructure/proxy/image-cache.ts`:

```ts
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_CACHE_MAX_FILES = 500;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const EVICT_CHECK_MS = 60 * 1000;

export interface CachedImage {
  buffer: Buffer;
  contentType: string;
}

let lastEvictionCheck = 0;

function getCacheDir(): string {
  return process.env.IMAGE_CACHE_DIR ?? path.join(process.cwd(), '.cache', 'images');
}

function cacheId(url: string, headers?: Record<string, string>): string {
  return createHash('sha256').update(`${url}\n${JSON.stringify(headers ?? {})}`).digest('hex');
}

function metaPathFor(id: string): string {
  return path.join(getCacheDir(), `${id}.json`);
}

function binPathFor(id: string): string {
  return path.join(getCacheDir(), `${id}.bin`);
}

export async function getCachedImage(
  url: string,
  headers?: Record<string, string>
): Promise<CachedImage | undefined> {
  const id = cacheId(url, headers);
  try {
    const stat = await fs.stat(binPathFor(id));
    if (Date.now() - stat.mtimeMs > IMAGE_CACHE_TTL_MS) return undefined;
    const [metaRaw, buffer] = await Promise.all([
      fs.readFile(metaPathFor(id), 'utf8'),
      fs.readFile(binPathFor(id)),
    ]);
    if (buffer.length === 0 || buffer.length > MAX_SIZE_BYTES) return undefined;
    const meta = JSON.parse(metaRaw) as { contentType: string };
    return { buffer, contentType: meta.contentType };
  } catch {
    return undefined;
  }
}

export async function setCachedImage(
  url: string,
  headers: Record<string, string> | undefined,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const id = cacheId(url, headers);
  try {
    await fs.mkdir(getCacheDir(), { recursive: true });
    await fs.writeFile(binPathFor(id), buffer);
    await fs.writeFile(metaPathFor(id), JSON.stringify({ contentType }));
    await maybeEvictOldFiles();
  } catch {
    // best effort
  }
}

async function maybeEvictOldFiles(): Promise<void> {
  const now = Date.now();
  if (now - lastEvictionCheck < EVICT_CHECK_MS) return;
  lastEvictionCheck = now;
  try {
    const entries = await fs.readdir(getCacheDir(), { withFileTypes: true });
    const bins = entries.filter((e) => e.isFile() && e.name.endsWith('.bin'));
    if (bins.length <= IMAGE_CACHE_MAX_FILES) return;
    const files = await Promise.all(
      bins.map(async (e) => {
        const full = path.join(getCacheDir(), e.name);
        const stat = await fs.stat(full);
        return { full, mtimeMs: stat.mtimeMs };
      })
    );
    files.sort((a, b) => a.mtimeMs - b.mtimeMs);
    for (const file of files.slice(0, files.length - IMAGE_CACHE_MAX_FILES)) {
      await fs.unlink(file.full).catch(() => {});
      await fs.unlink(`${file.full.replace(/\.bin$/, '.json')}`).catch(() => {});
    }
  } catch {
    // best effort
  }
}
```

- [ ] **Step 5: Wire the disk cache into the image proxy**

Replace `src/infrastructure/proxy/image-proxy.ts` with:

```ts
import { createLogger } from '@/shared/utils/logger';
import { IMAGE_PROXY_CACHE_MAX_AGE } from '@/shared/constants';
import { getCachedImage, setCachedImage } from '@/infrastructure/proxy/image-cache';

const logger = createLogger('ImageProxy');
const BLOCKED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/json'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const REFERER_MAP: Record<string, string> = {
  'comix.to': 'https://comix.to/',
  'webtoon-phinf.pstatic.net': 'https://www.webtoons.com/',
};

function getRefererForUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, referer] of Object.entries(REFERER_MAP)) {
      if (hostname.includes(domain)) return referer;
    }
  } catch {}
  return undefined;
}

export interface ProxyImageResult {
  stream: ReadableStream;
  contentType: string;
  cacheControl: string;
}

function bufferToStream(buffer: Uint8Array): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    },
  });
}

export async function proxyImage(
  url: string,
  headers?: Record<string, string>
): Promise<ProxyImageResult> {
  const cacheControl = `public, max-age=${IMAGE_PROXY_CACHE_MAX_AGE}, immutable`;

  const cached = await getCachedImage(url, headers);
  if (cached) {
    logger.debug(`Image cache hit: ${url}`);
    return {
      stream: bufferToStream(cached.buffer),
      contentType: cached.contentType,
      cacheControl,
    };
  }

  const referer = getRefererForUrl(url);
  const fetchHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(referer && { 'Referer': referer }),
    ...headers,
  };

  logger.debug(`Proxying image: ${url}`);

  const response = await fetch(url, { headers: fetchHeaders });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

  if (BLOCKED_CONTENT_TYPES.some(t => contentType.includes(t))) {
    throw new Error(`Blocked content type: ${contentType}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_SIZE_BYTES) {
    throw new Error(`Image too large: ${contentLength} bytes`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new Error(`Image too large: ${buffer.length} bytes`);
  }

  void setCachedImage(url, headers, buffer, contentType);

  return {
    stream: bufferToStream(buffer),
    contentType,
    cacheControl,
  };
}
```

- [ ] **Step 6: Add `.cache/` to .gitignore**

Append to `/.gitignore`:

```
# runtime caches
/.cache/
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/infrastructure/proxy/image-cache.test.ts src/infrastructure/proxy/image-proxy.test.ts`
Expected: PASS (3 + 3 tests)

- [ ] **Step 8: Commit**

```bash
git add .gitignore src/infrastructure/proxy/image-cache.ts src/infrastructure/proxy/image-cache.test.ts src/infrastructure/proxy/image-proxy.ts src/infrastructure/proxy/image-proxy.test.ts
git commit -m "perf: add on-disk cache to image proxy"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all suites, including the 13 existing + 4 new test files.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Run lint on changed files**

Run:
```bash
npx eslint src/middleware.ts src/lib/auth.ts src/shared/utils/rate-limiter.ts src/infrastructure/cache/provider-cache.ts src/infrastructure/proxy/image-cache.ts src/infrastructure/proxy/image-proxy.ts src/middleware.test.ts src/lib/auth.test.ts src/shared/utils/rate-limiter.test.ts src/infrastructure/cache/provider-cache.test.ts src/infrastructure/proxy/image-cache.test.ts src/infrastructure/proxy/image-proxy.test.ts
```
Expected: exit 0. Do NOT run repo-wide lint — 18 pre-existing errors (react-hooks/set-state-in-effect in unrelated files) are out of scope.

- [ ] **Step 4: Smoke-test auth behavior manually**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/posts?page=1&&limit=10
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/library/folders
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/me
```
Expected (with the dev server running and no session cookie): `/api/posts` → `401`, `/api/library/folders` → `401`, `/api/me` → `401`. (Before this change the unauthenticated posts/folders requests could intermittently return `500` when Supabase `getUser()` threw a network error.)

- [ ] **Step 5: Commit any stragglers**

```bash
git status
```
Expected: clean working tree (all changes committed in earlier tasks). If anything remains, commit it with an appropriate message before declaring done.