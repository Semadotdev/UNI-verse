# Post NSFW Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users tag posts as NSFW (manually or auto-tagged when the attached folder contains NSFW books), hide NSFW posts from under-18 users, badge them for adults, and add an All / Friends / NSFW filter to the posts feed.

**Architecture:** Server-enforced maturity. A `nsfw` (effective) + `nsfwExplicit` (user intent) pair on `Post` drives filtering, the badge, and edit semantics. Genre-based folder detection (`Library.categories` ∩ NSFW genre set) auto-tags posts at create/edit time. Feed filtering and the age gate live in `PostService` (with a pure `buildFeedWhere` helper); the client only surfaces UI (toggle, badge, filter tabs) and is always re-validated by the server.

**Tech Stack:** Next.js 16 App Router, Prisma 7 (PostgreSQL), TypeScript, vitest (added in Task 1 — the repo currently has no test framework). Quality gates: `npm run lint`, `npm run typecheck`, `npm test`.

**Spec:** `docs/superpowers/specs/2026-08-06-post-nsfw-tagging-design.md`

**Conventions:**
- Age rule: null `birthDate` is treated as **minor** (fail closed) for posts — stricter than the providers route's fail-open, intentional for explicit content.
- NSFW genre set (lowercase): `adult`, `ecchi`, `hentai`, `mature`, `ntr`, `smut`, `yaoi`, `yuri`.
- Commit style: `feat: <short description>` (matches repo history).

---

### Task 1: Add vitest test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest as a dev dependency**

Run: `npm i -D vitest`
Expected: vitest added to `devDependencies` in `package.json`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 3: Add a test script to `package.json`**

Add to the `"scripts"` object (keep existing entries unchanged):

```json
"test": "vitest run --passWithNoTests"
```

- [ ] **Step 4: Verify the runner works with no tests yet**

Run: `npm test`
Expected: PASS — vitest reports "No test files found" but exits 0 (due to `--passWithNoTests`).

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts package-lock.json
git commit -m "chore: add vitest test runner"
```

---

### Task 2: NSFW genre detection helper

**Files:**
- Create: `src/domain/constants/nsfw-genres.ts`
- Create: `src/domain/constants/nsfw-genres.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/domain/constants/nsfw-genres.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isNsfwCategories, NSFW_CATEGORIES } from "./nsfw-genres";

describe("isNsfwCategories", () => {
  it("returns true when any category is nsfw", () => {
    expect(isNsfwCategories(["Action", "Ecchi"])).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isNsfwCategories(["ADULT"])).toBe(true);
    expect(isNsfwCategories(["hentai"])).toBe(true);
  });

  it("returns false for non-nsfw categories", () => {
    expect(isNsfwCategories(["Action", "Romance", "Drama"])).toBe(false);
  });

  it("returns false for empty categories", () => {
    expect(isNsfwCategories([])).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isNsfwCategories([" Smut "])).toBe(true);
  });

  it("exposes the canonical nsfw set", () => {
    expect(NSFW_CATEGORIES).toContain("yaoi");
    expect(NSFW_CATEGORIES).toContain("yuri");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/constants/nsfw-genres.test.ts`
Expected: FAIL — "Cannot find module './nsfw-genres'".

- [ ] **Step 3: Write the implementation**

Create `src/domain/constants/nsfw-genres.ts`:

```ts
export const NSFW_CATEGORIES = [
  "adult",
  "ecchi",
  "hentai",
  "mature",
  "ntr",
  "smut",
  "yaoi",
  "yuri",
] as const;

export function isNsfwCategories(categories: string[]): boolean {
  const set = new Set<string>(NSFW_CATEGORIES);
  return categories.some((category) => set.has(category.trim().toLowerCase()));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/constants/nsfw-genres.test.ts`
Expected: PASS — all 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/constants/nsfw-genres.ts src/domain/constants/nsfw-genres.test.ts
git commit -m "feat: add nsfw category detection helper"
```

---

### Task 3: Age helper

**Files:**
- Create: `src/lib/age.ts`
- Create: `src/lib/age.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/age.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ageFromBirthDate, isAdult } from "./age";

const days = (n: number) => n * 24 * 60 * 60 * 1000;

describe("ageFromBirthDate", () => {
  it("returns null when birthDate is null", () => {
    expect(ageFromBirthDate(null)).toBeNull();
  });

  it("computes an age from a birth date", () => {
    const now = Date.now();
    const birth = new Date(now - days(365.25 * 20));
    expect(ageFromBirthDate(birth)).toBe(20);
  });
});

describe("isAdult", () => {
  it("returns true at exactly 18", () => {
    const birth = new Date(Date.now() - days(365.25 * 18));
    expect(isAdult(birth)).toBe(true);
  });

  it("returns false just under 18", () => {
    const birth = new Date(Date.now() - days(365.25 * 17));
    expect(isAdult(birth)).toBe(false);
  });

  it("returns false for null birthDate (fail closed)", () => {
    expect(isAdult(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/age.test.ts`
Expected: FAIL — "Cannot find module './age'".

- [ ] **Step 3: Write the implementation**

Create `src/lib/age.ts`:

```ts
export function ageFromBirthDate(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  return Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

export function isAdult(birthDate: Date | null): boolean {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= 18;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/age.test.ts`
Expected: PASS — all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/age.ts src/lib/age.test.ts
git commit -m "feat: add age helper for 18+ gating"
```

---

### Task 4: Pure feed where-builder

**Files:**
- Create: `src/application/services/post-feed-where.ts`
- Create: `src/application/services/post-feed-where.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/application/services/post-feed-where.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildFeedWhere } from "./post-feed-where";

const base = {
  username: undefined,
  authorId: undefined,
  feed: undefined as "all" | "friends" | "nsfw" | undefined,
  viewerIsAdult: true,
  friendIds: [],
};

describe("buildFeedWhere", () => {
  it("does not filter nsfw for adults on the default feed", () => {
    const where = buildFeedWhere(base);
    expect(where).not.toHaveProperty("nsfw");
  });

  it("hides nsfw for minors on the default feed", () => {
    const where = buildFeedWhere({ ...base, viewerIsAdult: false });
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
    const where = buildFeedWhere({ ...base, feed: "friends", friendIds: ["u2"], viewerIsAdult: false });
    expect(where.nsfw).toBe(false);
    expect(where.authorId).toEqual({ in: ["u2"] });
  });

  it("only nsfw posts for adults on the nsfw feed", () => {
    const where = buildFeedWhere({ ...base, feed: "nsfw" });
    expect(where.nsfw).toBe(true);
  });

  it("forces an empty result for minors on the nsfw feed", () => {
    const where = buildFeedWhere({ ...base, feed: "nsfw", viewerIsAdult: false });
    expect(where.nsfw).toBe(true);
    expect(where.id).toEqual({ in: [] });
  });

  it("scopes to authorId when a username is provided", () => {
    const where = buildFeedWhere({ ...base, username: "alice", authorId: "u9" });
    expect(where.authorId).toBe("u9");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/application/services/post-feed-where.test.ts`
Expected: FAIL — "Cannot find module './post-feed-where'".

- [ ] **Step 3: Write the implementation**

Create `src/application/services/post-feed-where.ts`:

```ts
import type { Prisma } from "@prisma/client";

export type PostFeed = "all" | "friends" | "nsfw";

export interface BuildFeedWhereInput {
  username?: string;
  authorId?: string;
  feed?: PostFeed;
  viewerIsAdult: boolean;
  friendIds: string[];
}

export function buildFeedWhere(input: BuildFeedWhereInput): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = {};

  if (input.username) {
    where.authorId = input.authorId;
  }

  if (input.feed === "friends") {
    where.authorId = { in: input.friendIds };
  }

  if (input.feed === "nsfw") {
    where.nsfw = true;
    if (!input.viewerIsAdult) {
      where.id = { in: [] };
    }
  } else if (!input.viewerIsAdult) {
    where.nsfw = false;
  }

  return where;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/application/services/post-feed-where.test.ts`
Expected: PASS — all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/application/services/post-feed-where.ts src/application/services/post-feed-where.test.ts
git commit -m "feat: add pure feed where-builder for post filters"
```

---

### Task 5: Prisma schema — `Post.nsfw` + `Post.nsfwExplicit`

**Files:**
- Modify: `prisma/schema.prisma`
- Generated: `prisma/migrations/<timestamp>_add_post_nsfw/`

- [ ] **Step 1: Add the columns to the `Post` model**

In `prisma/schema.prisma`, inside the `Post` model (after the `folderId` line ~219), add:

```prisma
  nsfw         Boolean   @default(false)
  nsfwExplicit Boolean   @default(false)
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma migrate dev --name add_post_nsfw`

Expected: a new migration `prisma/migrations/<timestamp>_add_post_nsfw/migration.sql` adding two columns with defaults, and the Prisma client regenerates.

> If the dev database is unreachable, fall back to: `npx prisma db push` and note the schema drift. `migrate dev` is preferred.

- [ ] **Step 3: Verify the generated client exposes the fields**

Run: `npx prisma generate`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add nsfw and nsfwExplicit columns to posts"
```

---

### Task 6: Post entity — `nsfw` fields + `toPost` mapping

**Files:**
- Modify: `src/domain/entities/post.ts`
- Modify: `src/application/services/post.service.ts` (only `toPost`)

- [ ] **Step 1: Update the `Post` entity**

In `src/domain/entities/post.ts`:

- Add `nsfw: boolean;` to the `Post` interface (after `canEdit`, line 47).
- Add `nsfw?: boolean;` to `CreatePostInput` (after `imageUrls`, line 53).
- Add `nsfw?: boolean;` to `UpdatePostInput` (after `folderId`, line 58).

- [ ] **Step 2: Update `toPost` in `PostService`**

In `src/application/services/post.service.ts`, inside `toPost` (line 182), add `nsfw: p.nsfw,` to the returned object (after `id: p.id,`).

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS. (The Prisma types now include `nsfw` on the row; `toPost` sets the entity field.)

- [ ] **Step 4: Commit**

```bash
git add src/domain/entities/post.ts src/application/services/post.service.ts
git commit -m "feat: add nsfw to post entity and post service mapping"
```

---

### Task 7: PostService — age gate, auto-tag, feed filters

**Files:**
- Modify: `src/application/services/post.service.ts`
- Create: `src/application/services/post.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/application/services/post.service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    like: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    user: { findUnique: vi.fn() },
    folder: { findUnique: vi.fn(), findFirst: vi.fn() },
    friend: { findMany: vi.fn() },
    library: { findMany: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/application/services/notification.service", () => ({
  NotificationService: class {
    onPostCommented = vi.fn().mockResolvedValue(undefined);
    onPostLiked = vi.fn().mockResolvedValue(undefined);
    onCommentReplied = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@/application/services/upload.service", () => ({
  UploadService: class {
    deleteImages = vi.fn().mockResolvedValue(undefined);
  },
}));

import { prisma } from "@/infrastructure/database/prisma-client";
import { PostService } from "./post.service";

const ADULT = new Date("2000-01-01");
const MINOR = new Date("2010-01-01");

function postRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    body: "hello world",
    authorId: "u1",
    folderId: null,
    nsfw: false,
    nsfwExplicit: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    author: { username: "alice", name: null, avatarUrl: null },
    images: [],
    folder: null,
    _count: { comments: 0, likes: 0 },
    ...overrides,
  };
}

const folderRow = (id: string, userId = "u1") => ({
  id,
  userId,
  name: "Folder",
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("PostService.create", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(folderRow("f1") as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({ id: "f1", items: [] } as never);
  });

  it("auto-tags nsfw when the attached folder contains nsfw books", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Ecchi", "Drama"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(
      postRow({ nsfw: true, nsfwExplicit: false }) as never
    );

    const post = await svc.create("u1", { body: "hello", folderId: "f1" });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(true);
  });

  it("stores an explicit nsfw tag when the folder is clean", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(
      postRow({ nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.create("u1", { body: "hello", folderId: "f1", nsfw: true });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: true }),
      })
    );
    expect(post.nsfw).toBe(true);
  });

  it("does not tag when folder is clean and nsfw not provided", async () => {
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f1",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.create).mockResolvedValue(postRow({ nsfw: false, nsfwExplicit: false }) as never);

    const post = await svc.create("u1", { body: "hello", folderId: "f1" });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: false, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(false);
  });
});

describe("PostService.update", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.folder.findFirst).mockResolvedValue(folderRow("f2") as never);
    vi.mocked(prisma.like.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);
  });

  it("un-tags when the folder becomes clean and the tag was never explicit", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: false }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f2", nsfw: false, nsfwExplicit: false }) as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f2",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: "f2", nsfw: false, nsfwExplicit: false }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", folderId: "f2" });

    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: false, nsfwExplicit: false }),
      })
    );
    expect(post.nsfw).toBe(false);
  });

  it("keeps an explicit tag when the folder becomes clean", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f1", nsfw: true, nsfwExplicit: true }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: "f2", nsfw: true, nsfwExplicit: true }) as never);
    vi.mocked(prisma.folder.findUnique).mockResolvedValue({
      id: "f2",
      items: [{ categories: ["Action"] }],
    } as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: "f2", nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", folderId: "f2" });

    expect(post.nsfw).toBe(true);
  });

  it("honors an explicit nsfw toggle sent by the client", async () => {
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: null, nsfw: false, nsfwExplicit: false }) as never)
      .mockResolvedValueOnce(postRow({ id: "p1", folderId: null, nsfw: true, nsfwExplicit: true }) as never);
    vi.mocked(prisma.post.update).mockResolvedValue(
      postRow({ id: "p1", folderId: null, nsfw: true, nsfwExplicit: true }) as never
    );

    const post = await svc.update("p1", "u1", { body: "hello", nsfw: true });

    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nsfw: true, nsfwExplicit: true }),
      })
    );
    expect(post.nsfw).toBe(true);
  });
});

describe("PostService.get age gate", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.like.findUnique).mockResolvedValue(null as never);
  });

  it("returns null for a minor viewing an nsfw post", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: true }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u2", role: "user", birthDate: MINOR } as never);

    const post = await svc.get("p1", "u2");
    expect(post).toBeNull();
  });

  it("returns an nsfw post for an adult viewer", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: true }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);

    const post = await svc.get("p1", "u1");
    expect(post).not.toBeNull();
    expect(post!.nsfw).toBe(true);
  });

  it("returns a non-nsfw post for a minor", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(postRow({ nsfw: false }) as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u2", role: "user", birthDate: MINOR } as never);

    const post = await svc.get("p1", "u2");
    expect(post).not.toBeNull();
  });
});

describe("PostService.listFeed", () => {
  let svc: PostService;

  beforeEach(() => {
    svc = new PostService();
    vi.mocked(prisma.post.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.post.count).mockResolvedValue(0);
    vi.mocked(prisma.like.findMany).mockResolvedValue([] as never);
  });

  it("adds nsfw:false for minors on the default feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: MINOR } as never);

    await svc.listFeed("u1", 1, 10);

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ nsfw: false }) })
    );
  });

  it("does not add nsfw filtering for adults on the default feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);

    await svc.listFeed("u1", 1, 10);

    const call = vi.mocked(prisma.post.findMany).mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where).not.toHaveProperty("nsfw");
  });

  it("filters to confirmed friends on the friends feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: ADULT } as never);
    vi.mocked(prisma.friend.findMany).mockResolvedValue([
      { userId: "u1", friendId: "u2" },
      { userId: "u3", friendId: "u1" },
    ] as never);

    await svc.listFeed("u1", 1, 10, { feed: "friends" });

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ authorId: { in: ["u2", "u3"] } }) })
    );
  });

  it("returns empty for a minor requesting the nsfw feed", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", role: "user", birthDate: MINOR } as never);

    const res = await svc.listFeed("u1", 1, 10, { feed: "nsfw" });

    expect(res.data).toEqual([]);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: [] } }) })
    );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/application/services/post.service.test.ts`
Expected: FAIL — `PostService.create/update/get/listFeed` don't yet accept/set `nsfw`, so assertions like `expect(post.nsfw).toBe(true)` fail on undefined, or the mock call assertions fail.

- [ ] **Step 3: Implement the service changes**

Rewrite the relevant parts of `src/application/services/post.service.ts`:

**Imports** (add two lines at the top):

```ts
import { isAdult } from '@/lib/age';
import { buildFeedWhere, type PostFeed } from '@/application/services/post-feed-where';
import { isNsfwCategories } from '@/domain/constants/nsfw-genres';
```

**`listFeed`** — replace the body of `listFeed` (lines 35-76) with:

```ts
  async listFeed(
    userId: string,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    filter?: { username?: string; feed?: PostFeed }
  ): Promise<PaginatedResult<Post>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const skip = (page - 1) * safeLimit;

    let authorId: string | undefined;
    if (filter?.username) {
      const author = await prisma.user.findUnique({
        where: { username: filter.username },
        select: { id: true },
      });
      if (!author) return { data: [], page, totalPages: 0, hasMore: false };
      authorId = author.id;
    }

    const [viewer, friendRows] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { role: true, birthDate: true } }),
      filter?.feed === 'friends'
        ? prisma.friend.findMany({
            where: { OR: [{ userId }, { friendId: userId }] },
            select: { userId: true, friendId: true },
          })
        : Promise.resolve([]),
    ]);

    const friendIds = friendRows.map((r) => (r.userId === userId ? r.friendId : r.userId));
    const where = buildFeedWhere({
      username: filter?.username,
      authorId,
      feed: filter?.feed,
      viewerIsAdult: isAdult(viewer?.birthDate ?? null),
      friendIds,
    });

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.post.count({ where }),
    ]);
    const liked = await prisma.like.findMany({
      where: { userId, postId: { in: posts.map((p) => p.id) } },
      select: { postId: true },
    });

    const likedSet = new Set(liked.map((l) => l.postId));
    const isAdmin = viewer?.role === 'admin';
    const data = posts.map((p) => this.toPost(p, userId, isAdmin, likedSet.has(p.id)));
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return { data, page, totalPages, hasMore: page < totalPages };
  }
```

**`get`** — replace the body (lines 78-88) with:

```ts
  async get(postId: string, viewerId: string): Promise<Post | null> {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: POST_INCLUDE });
    if (!post) return null;

    const [liked, viewer] = await Promise.all([
      prisma.like.findUnique({ where: { postId_userId: { postId, userId: viewerId } } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { role: true, birthDate: true } }),
    ]);

    if (post.nsfw && !isAdult(viewer?.birthDate ?? null)) {
      return null;
    }

    return this.toPost(post, viewerId, viewer?.role === 'admin', Boolean(liked));
  }
```

**`create`** — replace the `prisma.post.create` call (lines 104-114) with:

```ts
    const folderNsfw = input.folderId ? await this.folderHasNsfw(input.folderId) : false;
    const explicitNsfw = Boolean(input.nsfw);

    const post = await prisma.post.create({
      data: {
        authorId,
        body,
        folderId: input.folderId ?? null,
        nsfw: explicitNsfw || folderNsfw,
        nsfwExplicit: explicitNsfw,
        images: {
          create: imageUrls.map((url, index) => ({ url, position: index })),
        },
      },
      include: POST_INCLUDE,
    });
```

**`update`** — replace the body (lines 120-145) with:

```ts
  async update(postId: string, authorId: string, input: UpdatePostInput): Promise<Post> {
    const existing = await prisma.post.findUnique({ where: { id: postId } });
    if (!existing) throw new Error('Post not found');
    if (existing.authorId !== authorId) throw new Error('Forbidden');

    const body = (input.body ?? existing.body).trim();
    if (body.length > MAX_BODY_LENGTH) throw new Error('Body too long');

    const folderId = input.folderId === undefined ? existing.folderId : input.folderId;
    if (folderId) {
      await this.assertOwnedFolder(folderId, authorId);
    }

    const explicit = input.nsfw === undefined ? existing.nsfwExplicit : Boolean(input.nsfw);
    const folderNsfw = folderId ? await this.folderHasNsfw(folderId) : false;

    await prisma.post.update({
      where: { id: postId },
      data: {
        body,
        folderId,
        nsfw: explicit || folderNsfw,
        nsfwExplicit: explicit,
      },
    });

    const updated = await this.get(postId, authorId);
    if (!updated) throw new Error('Post not found');
    return updated;
  }
```

**Add a private helper** — insert after `assertOwnedFolder` (line 180):

```ts
  private async folderHasNsfw(folderId: string): Promise<boolean> {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { items: { select: { categories: true } } },
    });
    return folder ? folder.items.some((item) => isNsfwCategories(item.categories)) : false;
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/application/services/post.service.test.ts`
Expected: PASS — all 13 tests.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/application/services/post.service.ts src/application/services/post.service.test.ts
git commit -m "feat: enforce nsfw age gate, auto-tagging, and feed filters in post service"
```

---

### Task 8: `/api/posts` — feed filter + nsfw on create

**Files:**
- Modify: `src/app/api/posts/route.ts`

- [ ] **Step 1: Add the feed filter to GET and nsfw to POST**

In `src/app/api/posts/route.ts`:

- Add import: `import type { PostFeed } from '@/application/services/post-feed-where';`
- In GET, replace the username parsing (line 15) with:

```ts
    const username = searchParams.get('username') || undefined;
    const filter = searchParams.get('filter') || undefined;
    const feed: PostFeed | undefined = filter === 'friends' || filter === 'nsfw' ? filter : undefined;
```

- Replace the `postService.listFeed` call (line 17) with:

```ts
    const result = await postService.listFeed(userId, page, limit, { username, feed });
```

- In POST, add `nsfw` to the `postService.create` input (after `imageUrls`, line 42):

```ts
      nsfw: typeof body.nsfw === 'boolean' ? body.nsfw : false,
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/posts/route.ts
git commit -m "feat: accept feed filter and nsfw flag on posts api"
```

---

### Task 9: `/api/posts/[id]` — nsfw on PATCH

**Files:**
- Modify: `src/app/api/posts/[id]/route.ts`

- [ ] **Step 1: Pass nsfw through on PATCH**

In `src/app/api/posts/[id]/route.ts`, replace the `postService.update` input (lines 38-41) with:

```ts
    const post = await postService.update(id, userId, {
      body: typeof body.body === 'string' ? body.body : undefined,
      folderId: body.folderId === undefined ? undefined : typeof body.folderId === 'string' ? body.folderId : null,
      nsfw: typeof body.nsfw === 'boolean' ? body.nsfw : undefined,
    });
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/posts/[id]/route.ts"
git commit -m "feat: accept nsfw flag on post update"
```

---

### Task 10: Folder preview — age gate for NSFW posts

**Files:**
- Modify: `src/app/api/posts/[id]/folder/route.ts`

- [ ] **Step 1: Gate the route for minors**

In `src/app/api/posts/[id]/folder/route.ts`:

- Add import: `import { isAdult } from '@/lib/age';`
- Replace the block from `await getAuthUserId();` through the `if (!post?.folder)` check (lines 11-40) with:

```ts
    const userId = await getAuthUserId();
    const { id } = await params;

    const [post, viewer] = await Promise.all([
      prisma.post.findUnique({
        where: { id },
        select: {
          nsfw: true,
          folder: {
            select: {
              id: true,
              name: true,
              _count: { select: { items: true } },
              items: {
                orderBy: { updatedAt: 'desc' },
                select: {
                  providerId: true,
                  mangaId: true,
                  title: true,
                  coverUrl: true,
                  status: true,
                  categories: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } }),
    ]);

    if (!post?.folder) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'Folder not found'), { status: 404 });
    }

    if (post.nsfw && !isAdult(viewer?.birthDate ?? null)) {
      return NextResponse.json(errorResponse('NOT_FOUND', 'Folder not found'), { status: 404 });
    }
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/posts/[id]/folder/route.ts"
git commit -m "fix: age-gate folder preview for nsfw posts"
```

---

### Task 11: `/api/me` — expose `isAdult`

**Files:**
- Modify: `src/app/api/me/route.ts`

- [ ] **Step 1: Add birthDate to the select and isAdult to the response**

In `src/app/api/me/route.ts`:

- Add import: `import { isAdult } from '@/lib/age';`
- Add `birthDate: true,` to the `select` object (after `role: true,` line 24).
- Add `isAdult: isAdult(user.birthDate),` to the `successResponse` object (after `friendCount`, line 42).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/me/route.ts
git commit -m "feat: expose isAdult on the me endpoint"
```

---

### Task 12: Library folders — `nsfw` flag

**Files:**
- Modify: `src/application/services/library.service.ts`
- Modify: `src/contexts/LibraryContext.tsx`

- [ ] **Step 1: Compute `nsfw` in `getFolders`**

In `src/application/services/library.service.ts`:

- Add import: `import { isNsfwCategories } from '@/domain/constants/nsfw-genres';`
- Replace `getFolders` (lines 109-122) with:

```ts
  async getFolders(userId: string) {
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        items: { select: { categories: true } },
      },
      orderBy: { name: 'asc' },
    });
    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      count: f._count.items,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      nsfw: f.items.some((item) => isNsfwCategories(item.categories)),
    }));
  }
```

- [ ] **Step 2: Add `nsfw` to the client `Folder` type**

In `src/contexts/LibraryContext.tsx`, add `nsfw: boolean;` to the `Folder` interface (after `count`, line 26).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (No other consumer constructs `Folder` objects by hand; they all come from the API.)

- [ ] **Step 4: Commit**

```bash
git add src/application/services/library.service.ts src/contexts/LibraryContext.tsx
git commit -m "feat: expose nsfw flag on library folders"
```

---

### Task 13: Shared `NsfwBadge` component + Navbar reuse

**Files:**
- Create: `src/components/ui/NsfwBadge.tsx`
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Create the shared badge**

Create `src/components/ui/NsfwBadge.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function NsfwBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded-full leading-none",
        className
      )}
    >
      18+
    </span>
  );
}
```

- [ ] **Step 2: Reuse it in the Navbar**

In `src/components/layout/Navbar.tsx`:
- Delete the local `NsfwBadge` definition (lines 32-36).
- Add import: `import { NsfwBadge } from "@/components/ui/NsfwBadge";`
- The existing usage at line 204 continues to work unchanged.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/NsfwBadge.tsx src/components/layout/Navbar.tsx
git commit -m "refactor: extract shared nsfw badge component"
```

---

### Task 14: PostCard — render the 18+ badge

**Files:**
- Modify: `src/components/posts/PostCard.tsx`

- [ ] **Step 1: Add the badge next to the timestamp**

In `src/components/posts/PostCard.tsx`:
- Add import: `import { NsfwBadge } from "@/components/ui/NsfwBadge";`
- Replace the timestamp line in the author header (line 119):

```tsx
              <p className="flex items-center gap-1.5 text-xs text-muted">
                {timeAgo(post.createdAt)}
                {post.nsfw && <NsfwBadge />}
              </p>
```

- Replace the `hideAuthor` timestamp (line 124):

```tsx
        {hideAuthor && (
          <p className="flex-1 flex items-center gap-1.5 text-xs text-muted">
            {timeAgo(post.createdAt)}
            {post.nsfw && <NsfwBadge />}
          </p>
        )}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/posts/PostCard.tsx
git commit -m "feat: show nsfw badge on post cards"
```

---

### Task 15: PostComposer — NSFW toggle with forced auto-check

**Files:**
- Modify: `src/components/posts/PostComposer.tsx`

- [ ] **Step 1: Add the `nsfw` field to `FolderOption`**

In `src/components/posts/PostComposer.tsx`, add `nsfw: boolean;` to the `FolderOption` interface (after `count`, line 12).

- [ ] **Step 2: Add toggle state and derived values**

After the existing state declarations (line 37), add:

```tsx
  const [nsfw, setNsfw] = useState(editing?.nsfw ?? false);
```

After the `fileInputRef` declaration, add:

```tsx
  const selectedFolder = folders.find((f) => f.id === folderId) ?? null;
  const nsfwForced = Boolean(selectedFolder?.nsfw);
```

- [ ] **Step 3: Send `nsfw` on publish (omit when forced)**

Replace the `publish` API calls (lines 50-53) with:

```tsx
      if (editing) {
        const updated = await ApiClient.put<Post>(`/api/posts/${editing.id}`, {
          body: text,
          folderId,
          ...(nsfwForced ? {} : { nsfw }),
        });
        onSaved(updated);
      } else {
        const created = await ApiClient.post<Post>("/api/posts", {
          body: text,
          folderId,
          imageUrls: images,
          ...(nsfwForced ? {} : { nsfw }),
        });
        onSaved(created);
      }
```

- [ ] **Step 4: Reset the toggle**

In `reset` (line 66), add `setNsfw(false);`.

- [ ] **Step 5: Force the toggle when an NSFW folder is selected**

In the folder picker buttons, update the `onClick` handlers:

- "No folder" button (line 163): `setFolderId(null); setFolderPickerOpen(false);` — unchanged, but append nothing. Leave as-is.
- Folder option button (lines 173-176): replace its `onClick` with:

```tsx
                    onClick={() => {
                      setFolderId(folder.id);
                      if (folder.nsfw) setNsfw(true);
                      setFolderPickerOpen(false);
                    }}
```

- Add an NSFW chip in the folder option row — replace the count span (lines 179-181) with:

```tsx
                    <span className="flex items-center gap-1.5 shrink-0">
                      {folder.nsfw && <NsfwBadge />}
                      <span className="text-xs text-muted">{folder.count}</span>
                    </span>
```

- Add import at the top: `import { NsfwBadge } from "@/components/ui/NsfwBadge";`

- [ ] **Step 6: Render the toggle row**

After the closing `</div>` of the folder picker row (the `div` ending at line 214), add:

```tsx

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={nsfw}
            disabled={nsfwForced}
            onChange={(e) => setNsfw(e.target.checked)}
            className="accent-red-500"
          />
          <span className="text-sm text-zinc-300">Mark as NSFW (18+)</span>
          {nsfwForced && <span className="text-xs text-red-400">Folder contains NSFW content</span>}
        </label>
```

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/posts/PostComposer.tsx
git commit -m "feat: add nsfw toggle to post composer with folder auto-tag"
```

---

### Task 16: Posts page — All / Friends / NSFW filter

**Files:**
- Modify: `src/app/posts/page.tsx`

- [ ] **Step 1: Add feed state and imports**

In `src/app/posts/page.tsx`:
- Add import: `import { SegmentedControl } from "@/components/ui/SegmentedControl";`
- Add `isAdult?: boolean;` to the `Viewer` interface (after `name`, line 14).
- Add a `type Feed = "all" | "friends" | "nsfw";` (near the `Viewer` interface) and feed state, initialized from the URL:

```tsx
  const [feed, setFeed] = useState<Feed>(() => {
    const param = new URLSearchParams(window.location.search).get("filter");
    return param === "friends" || param === "nsfw" ? param : "all";
  });
```

- [ ] **Step 2: Feed the filter into `load`**

Replace the `load` callback (lines 28-33) with:

```tsx
  const load = useCallback(async (p: number, active: Feed) => {
    const res = await ApiClient.getWithMeta<Post[]>(
      `/api/posts?page=${p}&limit=10${active === "all" ? "" : `&filter=${active}`}`
    );
    setPosts((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
    setHasMore(Boolean(res.meta?.hasMore));
    setPage(p);
  }, []);
```

- Replace the initial-load effect (lines 42-44) with:

```tsx
  useEffect(() => {
    load(1, feed).catch(() => {}).finally(() => setLoading(false));
  }, [feed, load]);
```

- [ ] **Step 3: Add a filter switcher**

Add below the header block (after the closing `</div>` at line 95):

```tsx
      <SegmentedControl
        options={[
          { value: "all", label: "All" },
          { value: "friends", label: "Friends" },
          ...(viewer?.isAdult ? [{ value: "nsfw", label: "NSFW" }] : []),
        ]}
        value={feed}
        onChange={(value) => {
          const next = value as Feed;
          setFeed(next);
          setPosts([]);
          setPage(1);
          window.history.replaceState(null, "", `/posts?filter=${next}`);
        }}
        className="mb-5"
      />
```

- [ ] **Step 4: Remount the composer per post so the toggle resets**

Add `key={editing?.id ?? "create"}` to the `<PostComposer ...>` element (line 133):

```tsx
      <PostComposer
        key={editing?.id ?? "create"}
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
        folders={folders}
        viewer={viewer}
        editing={editing}
        onSaved={handleSaved}
      />
```

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/posts/page.tsx
git commit -m "feat: add all/friends/nsfw filter to posts feed"
```

---

### Task 17: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests (2 nsfw-genres + 3 age + 8 feed-where + 13 post.service = 26).

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS with no errors or warnings introduced.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, then as an **adult** account (birthDate ≥ 18):
1. Create a post with an NSFW folder attached → the NSFW toggle auto-checks and is disabled ("Folder contains NSFW content"); after publish the post card shows the 18+ badge.
2. Create a post with no folder, toggle "Mark as NSFW (18+)" → badge appears.
3. Create a post with a clean folder, toggle off → no badge.
4. Edit the NSFW-folder post, swap to a clean folder → badge disappears (auto-tag dropped).
5. Edit a manually-tagged post, swap to a clean folder → badge stays (explicit persists).
6. Feed tabs: All / Friends / NSFW. NSFW tab shows only tagged posts.
7. Folder picker shows an 18+ chip on NSFW folders.

As a **minor** account (birthDate < 18):
8. No NSFW tab in the feed; NSFW posts absent from All/Friends feeds.
9. Direct URL to an NSFW post or its folder preview returns 404.

---

## Self-Review Notes

- **Spec coverage:** data model (T5, T6), detection helper (T2), server tagging + edit semantics (T7), age gate incl. folder preview (T7, T10, T11), feed filters (T4, T7, T8, T16), composer toggle + forced auto-check (T15), badge (T13, T14), library folder nsfw flag (T12), tests (T1-T4, T7). All spec sections mapped.
- **`nsfwExplicit`** was added to the spec alongside `nsfw` — required for the approved "auto-tagged un-tags on clean swap" edit semantics.
- **Type consistency:** `PostFeed`, `BuildFeedWhereInput`, `Post.nsfw`, `Post.nsfwExplicit`, `Folder.nsfw`, `FolderOption.nsfw`, `Viewer.isAdult` names are consistent across all tasks.
- **No placeholders:** every code step contains the full implementation; verification commands are explicit.
- **Task 3 test fix (during execution):** "computes an age" uses `days(365.25 * 20)` (was `days(365 * 20)` — 7300 days ÷ 365.25 = 19.98 → floor 19, so the original test could never pass with the 365.25-divisor implementation).
- **Task 7 test fix (during execution):** added `vi.clearAllMocks()` to the `listFeed` describe's `beforeEach` — vitest (no clearMocks config) accumulates call history across tests, so the "adults on default feed" assertion reading `mock.calls[0][0]` picked up the previous test's call in a full-file run. The fix keeps every assertion verbatim and makes the suite order-independent.
- **Task 7 bugfix (during execution):** `update` re-fetched via `get(postId, authorId)`, which applied the age gate — so an author with null `birthDate` editing an NSFW post threw 'Post not found' AFTER the write committed. Fixed by giving `get` an optional `skipAgeGate = false` param and passing `true` from `update`'s readback. Regression test added (author null birthDate + auto-tag-persists path).
