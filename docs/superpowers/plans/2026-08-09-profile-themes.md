# Profile Themes Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users earn 1 coin per uniquely completed chapter, buy profile themes in a shop on their own profile page, and apply a theme (background gradient + accent color) that any visitor sees on their public profile.

**Architecture:** Theme definitions live in a typed constants catalog (`src/domain/constants/profile-themes.ts`); ownership, coin balance, and the active theme live in Postgres (Prisma). A `RewardService` awards coins idempotently inside a `$transaction` when `POST /api/history` reports a chapter completed. A `ThemesService` handles shop state, atomic purchase, and apply — thin API routes wrap it. The active theme is served through `GET /api/users/[username]` so visitors render it without extra requests; the shop/picker is a modal on the user's own profile.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma (PostgreSQL, Supabase), Tailwind v4, vitest 4. Quality gates: `npm run lint`, `npm run typecheck`, `npm test`.

**Spec:** `docs/superpowers/specs/2026-08-09-profile-themes-design.md`

**Conventions:**
- Commit style: `feat: <short description>` (matches repo history).
- Services throw domain error classes (`ThemeNotFoundError`, `InsufficientCoinsError`, `ThemeNotOwnedError`) with no HTTP concerns; routes map them to status codes.
- Tests mock the `prisma` client via `vi.mock("@/infrastructure/database/prisma-client", ...)` with `vi.hoisted` for shared transaction/table mocks (see `post.service.test.ts` for the established pattern).
- All endpoints use `getAuthUserId()` and the `successResponse` / `errorResponse` helpers from `@/domain/types/api`.

**File structure:**
- `prisma/schema.prisma` — `User.coins`, `PurchasedTheme`, `UserSettings.profileThemeId`, `ReadChapter.rewardedAt`
- `src/domain/constants/profile-themes.ts` — new catalog + helpers (pure, tested)
- `src/application/services/reward.service.ts` — new coin award (tested)
- `src/application/services/themes.service.ts` — new shop logic (tested)
- `src/app/api/themes/route.ts`, `src/app/api/themes/purchase/route.ts`, `src/app/api/themes/apply/route.ts` — new
- `src/app/api/history/route.ts` — reward hook
- `src/app/api/users/[username]/route.ts` — serve `theme` to visitors
- `src/components/profile/types.ts` — `ProfileData.theme`
- `src/components/profile/ProfileView.tsx` — theme rendering, coin badge, Themes button
- `src/components/profile/ProfileThemeModal.tsx` — new shop/picker modal
- `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx` — reward toast
- Tests: `profile-themes.test.ts`, `reward.service.test.ts`, `themes.service.test.ts`

---

### Task 1: Schema changes + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the four schema changes**

In `prisma/schema.prisma`, add `coins Int @default(0)` to the `User` model. Place it after `showNsfw` (line ~17):

```prisma
  showNsfw      Boolean   @default(true)
  coins         Int       @default(0)
```

Add the `PurchasedTheme` model to the file (put it right after the `User` model block):

```prisma
model PurchasedTheme {
  id          String   @id @default(cuid())
  userId      String
  themeId     String
  purchasedAt DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, themeId])
  @@index([userId])
}
```

Add `profileThemeId String?` to `UserSettings` (right after `theme String @default("dark")`):

```prisma
  theme           String   @default("dark")
  profileThemeId  String?
```

Add `rewardedAt DateTime?` to `ReadChapter` (after `readAt`):

```prisma
  readAt     DateTime @default(now())
  rewardedAt DateTime?
```

- [ ] **Step 2: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` (schema still compiles; tables not yet applied).

- [ ] **Step 3: Create the migration (SQL only, not applied)**

Run: `npm run db:migrate:create -- --name add_profile_themes`
Expected: a new directory `prisma/migrations/<timestamp>_add_profile_themes/` containing `migration.sql`.

> The `db-guard` script blocks `migrate dev` against the shared Supabase DB. `--create-only` only writes the migration file (it does not apply or drop anything), so if it is blocked, re-run with `ALLOW_DESTRUCTIVE_MIGRATIONS=true` set for this one command.

- [ ] **Step 4: Apply the migration**

Run: `npm run db:migrate`
Expected: `migration ... add_profile_themes ... applied` or "No pending migrations".

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: profile themes shop schema"
```

---

### Task 2: Theme catalog constants

**Files:**
- Create: `src/domain/constants/profile-themes.ts`
- Test: `src/domain/constants/profile-themes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/domain/constants/profile-themes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_ID,
  getProfileTheme,
  isDefaultTheme,
  PROFILE_THEMES,
  resolveProfileTheme,
} from "./profile-themes";

describe("profile-themes catalog", () => {
  it("contains a free default theme and priced themes", () => {
    expect(getProfileTheme(DEFAULT_THEME_ID)?.price).toBe(0);
    expect(PROFILE_THEMES.length).toBeGreaterThan(1);
    expect(PROFILE_THEMES.every((t) => t.price >= 0)).toBe(true);
  });

  it("resolves unknown ids to the default theme", () => {
    expect(resolveProfileTheme("nope").id).toBe(DEFAULT_THEME_ID);
    expect(resolveProfileTheme(null).id).toBe(DEFAULT_THEME_ID);
  });

  it("returns undefined for unknown ids on strict lookup", () => {
    expect(getProfileTheme("nope")).toBeUndefined();
  });

  it("isDefaultTheme matches only the default id", () => {
    expect(isDefaultTheme(DEFAULT_THEME_ID)).toBe(true);
    expect(isDefaultTheme("sunset")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`
Expected: FAIL — cannot resolve `./profile-themes`.

- [ ] **Step 3: Create the catalog**

Create `src/domain/constants/profile-themes.ts`:

```ts
export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    background: [string, string];
    accent: string;
  };
}

export const DEFAULT_THEME_ID = "default";

export const PROFILE_THEMES: ProfileTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "The classic look.",
    price: 0,
    colors: { background: ["#111118", "#111118"], accent: "#7C3AED" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm dusk gradients for cozy nights.",
    price: 25,
    colors: { background: ["#3d1f3d", "#c96f4a"], accent: "#f2cc8f" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool waves and deep blue.",
    price: 40,
    colors: { background: ["#0b2a3a", "#1f7a8c"], accent: "#66e0ff" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Quiet indigo after hours.",
    price: 60,
    colors: { background: ["#0d0d1a", "#1b1b3a"], accent: "#818cf8" },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Electric vibes that pop.",
    price: 100,
    colors: { background: ["#120a2f", "#3f1d78"], accent: "#00ffd1" },
  },
];

export function getProfileTheme(id: string): ProfileTheme | undefined {
  return PROFILE_THEMES.find((t) => t.id === id);
}

export function resolveProfileTheme(id: string | null | undefined): ProfileTheme {
  return getProfileTheme(id ?? DEFAULT_THEME_ID) ?? PROFILE_THEMES[0];
}

export function isDefaultTheme(id: string): boolean {
  return id === DEFAULT_THEME_ID;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts
git commit -m "feat: profile themes catalog"
```

---

### Task 3: RewardService (coin award)

**Files:**
- Create: `src/application/services/reward.service.ts`
- Test: `src/application/services/reward.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/application/services/reward.service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, prisma } = vi.hoisted(() => ({
  tx: {
    readChapter: { updateMany: vi.fn() },
    user: { update: vi.fn() },
  },
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));

import { RewardService } from "./reward.service";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx));
});

describe("RewardService.awardChapterCompletion", () => {
  it("awards one coin when the chapter has not been rewarded yet", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValue({ coins: 5 });

    const res = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(tx.readChapter.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", providerId: "p1", mangaId: "m1", chapterId: "c1", rewardedAt: null },
      data: { rewardedAt: expect.any(Date) },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { coins: { increment: 1 } },
      select: { coins: true },
    });
    expect(res).toEqual({ rewarded: true, balance: 5 });
  });

  it("does not award when the chapter was already rewarded", async () => {
    tx.readChapter.updateMany.mockResolvedValue({ count: 0 });

    const res = await new RewardService().awardChapterCompletion("u1", "p1", "m1", "c1");

    expect(tx.user.update).not.toHaveBeenCalled();
    expect(res).toEqual({ rewarded: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/application/services/reward.service.test.ts`
Expected: FAIL — cannot resolve `./reward.service`.

- [ ] **Step 3: Implement RewardService**

Create `src/application/services/reward.service.ts`:

```ts
import { prisma } from '@/infrastructure/database/prisma-client';

export const CHAPTER_REWARD_COINS = 1;

export class RewardService {
  async awardChapterCompletion(
    userId: string,
    providerId: string,
    mangaId: string,
    chapterId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.readChapter.updateMany({
        where: { userId, providerId, mangaId, chapterId, rewardedAt: null },
        data: { rewardedAt: new Date() },
      });
      if (updated.count === 0) {
        return { rewarded: false as const };
      }
      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: CHAPTER_REWARD_COINS } },
        select: { coins: true },
      });
      return { rewarded: true as const, balance: user.coins };
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/application/services/reward.service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/application/services/reward.service.ts src/application/services/reward.service.test.ts
git commit -m "feat: coin reward service for chapter completion"
```

---

### Task 4: ThemesService (shop logic)

**Files:**
- Create: `src/application/services/themes.service.ts`
- Test: `src/application/services/themes.service.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/application/services/themes.service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { tx, prisma } = vi.hoisted(() => ({
  tx: {
    user: { updateMany: vi.fn() },
    purchasedTheme: { create: vi.fn() },
  },
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn() },
    purchasedTheme: { findMany: vi.fn(), findUnique: vi.fn() },
    userSettings: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));

import {
  InsufficientCoinsError,
  ThemeNotFoundError,
  ThemeNotOwnedError,
  ThemesService,
} from "./themes.service";
import { DEFAULT_THEME_ID } from "@/domain/constants/profile-themes";

beforeEach(() => {
  vi.clearAllMocks();
  prisma.$transaction.mockImplementation(async (cb: (t: typeof tx) => unknown) => cb(tx));
});

describe("ThemesService.getState", () => {
  it("always includes the default theme and resolves the active theme id", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 10 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: "sunset" });

    const state = await new ThemesService().getState("u1");

    expect(state.ownedThemeIds).toEqual(expect.arrayContaining([DEFAULT_THEME_ID, "sunset"]));
    expect(state.activeThemeId).toBe("sunset");
    expect(state.coins).toBe(10);
  });

  it("defaults the active theme to null when no settings row exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 0 });
    prisma.purchasedTheme.findMany.mockResolvedValue([]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().getState("u1");

    expect(state.activeThemeId).toBeNull();
  });
});

describe("ThemesService.purchase", () => {
  it("decrements coins atomically and records ownership", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);
    tx.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().purchase("u1", "sunset");

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "u1", coins: { gte: 25 } },
      data: { coins: { decrement: 25 } },
    });
    expect(tx.purchasedTheme.create).toHaveBeenCalledWith({
      data: { userId: "u1", themeId: "sunset" },
    });
    expect(state.coins).toBe(5);
  });

  it("throws when the user cannot afford the theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);
    tx.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(new ThemesService().purchase("u1", "sunset")).rejects.toBeInstanceOf(
      InsufficientCoinsError
    );
    expect(tx.purchasedTheme.create).not.toHaveBeenCalled();
  });

  it("is idempotent for an already-owned theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue({ id: "x" });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue(null);

    const state = await new ThemesService().purchase("u1", "sunset");

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(state.coins).toBe(5);
  });

  it("throws for an unknown theme id", async () => {
    await expect(new ThemesService().purchase("u1", "nope")).rejects.toBeInstanceOf(
      ThemeNotFoundError
    );
  });
});

describe("ThemesService.apply", () => {
  it("throws when the user does not own the theme", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue(null);

    await expect(new ThemesService().apply("u1", "sunset")).rejects.toBeInstanceOf(
      ThemeNotOwnedError
    );
  });

  it("sets the active theme when owned", async () => {
    prisma.purchasedTheme.findUnique.mockResolvedValue({ id: "x" });
    prisma.user.findUnique.mockResolvedValue({ coins: 5 });
    prisma.purchasedTheme.findMany.mockResolvedValue([{ themeId: "sunset" }]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: "sunset" });

    await new ThemesService().apply("u1", "sunset");

    expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", profileThemeId: "sunset" },
      update: { profileThemeId: "sunset" },
    });
  });

  it("allows applying the default theme without a purchase", async () => {
    prisma.user.findUnique.mockResolvedValue({ coins: 0 });
    prisma.purchasedTheme.findMany.mockResolvedValue([]);
    prisma.userSettings.findUnique.mockResolvedValue({ profileThemeId: DEFAULT_THEME_ID });

    await new ThemesService().apply("u1", DEFAULT_THEME_ID);

    expect(prisma.userSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { profileThemeId: DEFAULT_THEME_ID } })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/application/services/themes.service.test.ts`
Expected: FAIL — cannot resolve `./themes.service`.

- [ ] **Step 3: Implement ThemesService**

Create `src/application/services/themes.service.ts`:

```ts
import { prisma } from '@/infrastructure/database/prisma-client';
import {
  getProfileTheme,
  isDefaultTheme,
  PROFILE_THEMES,
  DEFAULT_THEME_ID,
} from '@/domain/constants/profile-themes';

export class ThemeNotFoundError extends Error {}
export class InsufficientCoinsError extends Error {}
export class ThemeNotOwnedError extends Error {}

export class ThemesService {
  async getState(userId: string) {
    const [user, purchased, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }),
      prisma.purchasedTheme.findMany({ where: { userId }, select: { themeId: true } }),
      prisma.userSettings.findUnique({ where: { userId }, select: { profileThemeId: true } }),
    ]);

    const ownedThemeIds = new Set(purchased.map((p) => p.themeId));
    ownedThemeIds.add(DEFAULT_THEME_ID);

    return {
      themes: PROFILE_THEMES,
      ownedThemeIds: Array.from(ownedThemeIds),
      activeThemeId: settings?.profileThemeId ?? null,
      coins: user?.coins ?? 0,
    };
  }

  async purchase(userId: string, themeId: string) {
    const theme = getProfileTheme(themeId);
    if (!theme) throw new ThemeNotFoundError(`Unknown theme: ${themeId}`);

    if (theme.price === 0) return this.getState(userId);

    const alreadyOwned = await prisma.purchasedTheme.findUnique({
      where: { userId_themeId: { userId, themeId } },
    });
    if (alreadyOwned) return this.getState(userId);

    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, coins: { gte: theme.price } },
        data: { coins: { decrement: theme.price } },
      });
      if (updated.count === 0) throw new InsufficientCoinsError('Not enough coins');
      await tx.purchasedTheme.create({ data: { userId, themeId } });
    });

    return this.getState(userId);
  }

  async apply(userId: string, themeId: string) {
    const theme = getProfileTheme(themeId);
    if (!theme) throw new ThemeNotFoundError(`Unknown theme: ${themeId}`);

    if (!(await this.isOwned(userId, themeId))) {
      throw new ThemeNotOwnedError('You do not own this theme');
    }

    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, profileThemeId: themeId },
      update: { profileThemeId: themeId },
    });

    return this.getState(userId);
  }

  private async isOwned(userId: string, themeId: string): Promise<boolean> {
    if (isDefaultTheme(themeId)) return true;
    const row = await prisma.purchasedTheme.findUnique({
      where: { userId_themeId: { userId, themeId } },
      select: { id: true },
    });
    return Boolean(row);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/application/services/themes.service.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the full suite to confirm nothing regressed**

Run: `npm test`
Expected: PASS (all existing tests + new ones).

- [ ] **Step 6: Commit**

```bash
git add src/application/services/themes.service.ts src/application/services/themes.service.test.ts
git commit -m "feat: themes service for shop state, purchase, apply"
```

---

### Task 5: Themes API routes

**Files:**
- Create: `src/app/api/themes/route.ts`
- Create: `src/app/api/themes/purchase/route.ts`
- Create: `src/app/api/themes/apply/route.ts`

- [ ] **Step 1: Create `src/app/api/themes/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { ThemesService } from '@/application/services/themes.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const themesService = new ThemesService();

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const state = await themesService.getState(userId);
    return NextResponse.json(successResponse(state));
  } catch (error) {
    return NextResponse.json(
      errorResponse('THEMES_ERROR', error instanceof Error ? error.message : 'Failed to load themes'),
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create `src/app/api/themes/purchase/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  InsufficientCoinsError,
  ThemeNotFoundError,
  ThemesService,
} from '@/application/services/themes.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const themesService = new ThemesService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json(errorResponse('MISSING_FIELDS', 'themeId is required'), { status: 400 });
    }

    const state = await themesService.purchase(userId, themeId);
    return NextResponse.json(successResponse(state));
  } catch (error) {
    if (error instanceof ThemeNotFoundError) {
      return NextResponse.json(errorResponse('THEME_NOT_FOUND', error.message), { status: 404 });
    }
    if (error instanceof InsufficientCoinsError) {
      return NextResponse.json(errorResponse('INSUFFICIENT_COINS', error.message), { status: 400 });
    }
    return NextResponse.json(
      errorResponse('THEMES_ERROR', error instanceof Error ? error.message : 'Failed to purchase theme'),
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create `src/app/api/themes/apply/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  ThemeNotFoundError,
  ThemeNotOwnedError,
  ThemesService,
} from '@/application/services/themes.service';
import { successResponse, errorResponse } from '@/domain/types/api';
import { getAuthUserId } from '@/lib/auth';

const themesService = new ThemesService();

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json(errorResponse('MISSING_FIELDS', 'themeId is required'), { status: 400 });
    }

    const state = await themesService.apply(userId, themeId);
    return NextResponse.json(successResponse(state));
  } catch (error) {
    if (error instanceof ThemeNotFoundError) {
      return NextResponse.json(errorResponse('THEME_NOT_FOUND', error.message), { status: 404 });
    }
    if (error instanceof ThemeNotOwnedError) {
      return NextResponse.json(errorResponse('THEME_NOT_OWNED', error.message), { status: 403 });
    }
    return NextResponse.json(
      errorResponse('THEMES_ERROR', error instanceof Error ? error.message : 'Failed to apply theme'),
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/themes
git commit -m "feat: themes shop API routes"
```

---

### Task 6: Wire the coin reward into history + reader toast

**Files:**
- Modify: `src/app/api/history/route.ts`
- Modify: `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`

- [ ] **Step 1: Update the history route to award coins on completion**

Edit `src/app/api/history/route.ts`:

- Add imports after the existing `HistoryService` import (line 2):

```ts
import { RewardService } from '@/application/services/reward.service';
```

- Add an instance below `const historyService = new HistoryService();` (line 6):

```ts
const rewardService = new RewardService();
```

- Replace the body of the `POST` handler (from `await historyService.updateProgress(...)` through the return) so the whole handler is:

```ts
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await request.json();
    const { providerId, mangaId, chapterId, chapterNum, title, coverUrl, progress, completed } = body;

    if (!providerId || !mangaId || !chapterId || chapterNum === undefined) {
      return NextResponse.json(
        errorResponse('MISSING_FIELDS', 'providerId, mangaId, chapterId, and chapterNum are required'),
        { status: 400 }
      );
    }

    await historyService.updateProgress(userId, providerId, mangaId, {
      chapterId,
      chapterNum,
      title,
      coverUrl,
      progress,
      completed,
    });

    let rewarded: boolean | undefined;
    let balance: number | undefined;
    if (completed === true) {
      const result = await rewardService.awardChapterCompletion(userId, providerId, mangaId, chapterId);
      rewarded = result.rewarded;
      if (result.rewarded) balance = result.balance;
    }

    return NextResponse.json(successResponse({ updated: true, rewarded, balance }));
  } catch (error) {
    return NextResponse.json(
      errorResponse('HISTORY_ERROR', error instanceof Error ? error.message : 'Failed to update history'),
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Show a toast in the reader when a coin is earned**

Edit `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`:

- Add to the imports (after line 13 `import { Slider } ...`):

```tsx
import { useToast } from "@/contexts/ToastContext";
```

- Add `const { addToast } = useToast();` inside `ReaderPage`, right after `const params = useParams();` (line 21).

- Replace the debounced progress effect (currently lines 101-110) so the POST handles the reward response:

```tsx
      ApiClient.post<{ rewarded?: boolean }>("/api/history", {
        providerId,
        mangaId,
        chapterId,
        chapterNum: currentChapter.number,
        title: mangaDetails.title,
        coverUrl: mangaDetails.cover,
        progress,
        completed,
      })
        .then((res) => {
          if (res.rewarded) addToast("You earned a coin!", "success");
        })
        .catch(() => {});
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/history/route.ts "src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx"
git commit -m "feat: award coins on chapter completion with reader toast"
```

---

### Task 7: Serve the active theme on public profiles

**Files:**
- Modify: `src/app/api/users/[username]/route.ts`
- Modify: `src/components/profile/types.ts`

- [ ] **Step 1: Add `theme` to the profile response**

Edit `src/app/api/users/[username]/route.ts`:

- Add an import after line 4:

```ts
import { resolveProfileTheme } from '@/domain/constants/profile-themes';
```

- In the `GET` handler, change the `prisma.user.findUnique` `select` so it also includes settings. Replace the current select block (lines 13-21) with:

```ts
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        settings: { select: { profileThemeId: true } },
        _count: { select: { posts: true } },
      },
    });
```

- In the `successResponse` object, add `theme` after the existing fields (after `isFriend,`):

```ts
        theme: resolveProfileTheme(user.settings?.profileThemeId),
```

- [ ] **Step 2: Add `theme` to `ProfileData`**

Edit `src/components/profile/types.ts`:

- Add an import at the top of the file:

```ts
import type { ProfileTheme } from "@/domain/constants/profile-themes";
```

- Add the field to the `ProfileData` interface:

```ts
export interface ProfileData {
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  postCount: number;
  friendCount?: number;
  isFriend?: boolean;
  theme?: ProfileTheme;
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/users/[username]/route.ts" src/components/profile/types.ts
git commit -m "feat: serve active profile theme to visitors"
```

---

### Task 8: ProfileThemeModal (shop + picker)

**Files:**
- Create: `src/components/profile/ProfileThemeModal.tsx`

- [ ] **Step 1: Create the modal component**

Create `src/components/profile/ProfileThemeModal.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Coins } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ApiClient } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import { DEFAULT_THEME_ID } from "@/domain/constants/profile-themes";
import type { ProfileTheme } from "@/domain/constants/profile-themes";

export interface ThemesState {
  themes: ProfileTheme[];
  ownedThemeIds: string[];
  activeThemeId: string | null;
  coins: number;
}

interface ProfileThemeModalProps {
  open: boolean;
  onClose: () => void;
  initialCoins: number;
  onCoinsChange: (coins: number) => void;
  onApplied: (themeId: string) => void;
}

type Tab = "shop" | "mine";

export function ProfileThemeModal({
  open,
  onClose,
  initialCoins,
  onCoinsChange,
  onApplied,
}: ProfileThemeModalProps) {
  const { addToast } = useToast();
  const [state, setState] = useState<ThemesState | null>(null);
  const [tab, setTab] = useState<Tab>("shop");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    ApiClient.get<ThemesState>("/api/themes")
      .then((s) => {
        if (cancelled) return;
        setState(s);
        onCoinsChange(s.coins);
      })
      .catch(() => addToast("Failed to load themes", "error"));
    return () => {
      cancelled = true;
    };
  }, [open, addToast, onCoinsChange]);

  if (!open) return null;

  const themes = state?.themes ?? [];
  const owned = new Set(state?.ownedThemeIds ?? []);
  const coins = state?.coins ?? initialCoins;
  const activeId = state?.activeThemeId ?? null;
  const visible = tab === "shop" ? themes : themes.filter((t) => owned.has(t.id));

  const purchase = async (themeId: string) => {
    setBusy(themeId);
    try {
      const s = await ApiClient.post<ThemesState>("/api/themes/purchase", { themeId });
      setState(s);
      onCoinsChange(s.coins);
      addToast("Theme purchased", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Purchase failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const apply = async (themeId: string) => {
    setBusy(themeId);
    try {
      const s = await ApiClient.post<ThemesState>("/api/themes/apply", { themeId });
      setState(s);
      onApplied(themeId);
      addToast("Theme applied", "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Apply failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Themes" size="md">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-bg-overlay p-1">
          <TabButton active={tab === "shop"} onClick={() => setTab("shop")}>
            Shop
          </TabButton>
          <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
            Mine
          </TabButton>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
          <Coins className="h-4 w-4 text-yellow-400" />
          {coins}
        </span>
      </div>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            {tab === "mine"
              ? "You don't own any themes yet. Head to the Shop tab!"
              : "No themes available."}
          </p>
        ) : (
          visible.map((t) => {
            const isOwned = owned.has(t.id);
            const isActive = activeId === t.id || (t.id === DEFAULT_THEME_ID && activeId === null);
            const canAfford = coins >= t.price;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg-overlay p-3"
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-lg border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.background[0]}, ${t.colors.background[1]})`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                  <p className="truncate text-xs text-muted">{t.description}</p>
                </div>
                {isOwned ? (
                  isActive ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => apply(t.id)}
                      disabled={busy === t.id}
                      className="rounded-lg border border-border bg-bg-raised px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-zinc-100 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => purchase(t.id)}
                    disabled={busy === t.id || !canAfford}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                      canAfford
                        ? "bg-primary text-white hover:bg-primary-light"
                        : "bg-bg-raised text-muted"
                    )}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    {t.price}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-primary text-white" : "text-zinc-300 hover:text-zinc-100"
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileThemeModal.tsx
git commit -m "feat: profile theme shop and picker modal"
```

---

### Task 9: Render themes on the profile + coin badge + Themes button

**Files:**
- Modify: `src/components/profile/ProfileView.tsx`

- [ ] **Step 1: Add imports and state**

Edit `src/components/profile/ProfileView.tsx`:

- Add `Coins` to the lucide imports. The file currently has no lucide import, so add one after the existing `import { PostSkeleton } ...` line (line 8):

```tsx
import { Coins } from "lucide-react";
```

- Add after the `PostSkeleton` import:

```tsx
import { ProfileThemeModal, type ThemesState } from "@/components/profile/ProfileThemeModal";
import {
  DEFAULT_THEME_ID,
  resolveProfileTheme,
  type ProfileTheme,
} from "@/domain/constants/profile-themes";
```

- Add these state hooks inside `ProfileView`, right after `const [editing, setEditing] = useState<Post | null>(null);` (line 47):

```tsx
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [coins, setCoins] = useState(0);
  const [activeTheme, setActiveTheme] = useState<ProfileTheme>(() =>
    resolveProfileTheme(profile.theme?.id)
  );
```

- Add an effect after the existing profile-sync effect (after the `useEffect` that ends at line 68) to load the owner's balance and active theme:

```tsx
  useEffect(() => {
    if (!isOwn) return;
    ApiClient.get<ThemesState>("/api/themes")
      .then((s) => {
        setCoins(s.coins);
        setActiveTheme(resolveProfileTheme(s.activeThemeId));
      })
      .catch(() => {});
  }, [isOwn]);
```

- [ ] **Step 2: Apply the theme to the header card**

Edit the `return` block. The current header card starts at line 152. Add derived values just before `return (` (after the `joinedAt` const, line 148):

```tsx
  const themed = activeTheme.id !== DEFAULT_THEME_ID;
  const themeBg = themed
    ? { background: `linear-gradient(135deg, ${activeTheme.colors.background[0]}, ${activeTheme.colors.background[1]})` }
    : undefined;
  const themeAccent = themed ? { borderColor: activeTheme.colors.accent } : undefined;
  const themeText = themed ? { color: activeTheme.colors.accent } : undefined;
  const themeOutline = themed
    ? { borderColor: activeTheme.colors.accent, color: activeTheme.colors.accent }
    : undefined;
```

Replace the header card opening div (currently line 152):

```tsx
      <div
        className={
          themed
            ? "rounded-2xl border border-border p-5"
            : "rounded-2xl border border-border bg-bg-raised p-5"
        }
        style={themeBg}
      >
```

Apply `style={themeAccent}` to the avatar `<img>` (line 154-159) — keep its existing className:

```tsx
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-border bg-bg-overlay shrink-0"
              style={themeAccent}
            />
```

Apply `style={themeText}` to the name `<h1>` (line 165):

```tsx
            <h1 className="text-xl font-bold text-zinc-100 break-words" style={themeText}>
```

- [ ] **Step 3: Add the coin badge and Themes button (own profile)**

Replace the own-profile buttons fragment (currently lines 187-207) so it becomes:

```tsx
            <>
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300">
                <Coins className="h-4 w-4 text-yellow-400" />
                {coins}
              </span>
              <button
                onClick={() => setSearchOpen(true)}
                style={themeOutline}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Search
              </button>
              <button
                onClick={openFriends}
                style={themeOutline}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Friends
              </button>
              <button
                onClick={() => setThemeModalOpen(true)}
                style={themeOutline}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Themes
              </button>
              <button
                onClick={onEdit}
                style={themeOutline}
                className="px-4 py-1.5 text-sm rounded-lg border border-border bg-bg-overlay text-zinc-300 hover:border-primary/50 hover:text-zinc-100 transition-all"
              >
                Edit profile
              </button>
            </>
```

- [ ] **Step 4: Render the modal**

Add the modal right after the `searchOpen && <FriendSearch ... />` line (currently line 268):

```tsx
      {isOwn && (
        <ProfileThemeModal
          open={themeModalOpen}
          onClose={() => setThemeModalOpen(false)}
          initialCoins={coins}
          onCoinsChange={setCoins}
          onApplied={(themeId) => setActiveTheme(resolveProfileTheme(themeId))}
        />
      )}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/ProfileView.tsx
git commit -m "feat: render profile theme, coin badge, and Themes button"
```

---

### Task 10: Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests including `profile-themes.test.ts`, `reward.service.test.ts`, `themes.service.test.ts`, and all pre-existing tests.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS — no lint errors.

- [ ] **Step 4: Build the app**

Run: `npm run build`
Expected: build succeeds (no errors).

- [ ] **Step 5: Commit any remaining work**

```bash
git status --short
git add -A
git commit -m "chore: profile themes verification"
```
Only commit if there are uncommitted changes.
