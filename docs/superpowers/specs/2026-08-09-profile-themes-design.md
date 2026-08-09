# Profile Themes Shop — Design

**Date:** 2026-08-09
**Status:** Approved

## Goal

Users earn **1 coin per uniquely completed chapter**, spend coins in a **shop on their own profile page** to buy **profile themes** (background gradient + accent color), and apply them to their public profile. Anyone visiting the profile sees the applied theme.

## Decisions (locked during brainstorming)

1. **What a theme changes:** background gradient + accent color on the profile header (name highlight, avatar ring, buttons). No layout or font changes.
2. **Earning coins:** reaching the last page sets `ReadingHistory.completed = true`. Award **1 coin per unique chapter, once, never re-awarded** on re-reads. Deduped server-side.
3. **Shop placement:** a "Themes" button on your own profile opens a modal with Shop and Mine tabs. No navbar changes.
4. **Economy:** 1 coin/chapter. Default theme is free and always owned. Purchasable themes priced 25/40/60/100 coins.
5. **Catalog:** code-defined constants file (like existing reaction/nsfw constants). Ownership + active choice live in the DB.
6. **Architecture:** server-side ownership and rendering. The active theme is served through `/api/users/[username]` so visitors see it.

## 1. Data model

Changes in `prisma/schema.prisma`:

- Add `coins Int @default(0)` to `User`.
- New model `PurchasedTheme`:
  ```
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
- Add `profileThemeId String?` to `UserSettings` — active theme; `null` = the built-in free "Default" theme.
- Add `rewardedAt DateTime?` to `ReadChapter` — dedup guard for coin awards.

## 2. Coin reward flow

New `src/application/services/reward.service.ts` with `awardChapterCompletion(userId, providerId, mangaId, chapterId)`:

1. Runs in a `prisma.$transaction`.
2. `ReadChapter.updateMany` where `{ userId, providerId, mangaId, chapterId, rewardedAt: null }` → set `rewardedAt: now()`. If 0 rows updated (already paid, or chapter never started) → return `{ rewarded: false }`.
3. If 1 row updated: `User.update` increment `coins` by 1 → return `{ rewarded: true, balance }`.

Security:

- Reward only pays when a `ReadChapter` row exists — that row is only created on chapter load via `POST /api/history/read`, so a client cannot forge completion for a chapter it never opened.
- The `rewardedAt: null` guard inside the transaction makes the award idempotent — re-reading the last page or spamming never double-pays.
- No farming cap: each unique chapter pays exactly once; farming is equivalent to actually reading.

API surface: the existing `POST /api/history` handler calls the service when `completed === true`; the response gains `rewarded?: boolean` and `balance?: number`. The reader shows a "You earned a coin!" toast when `rewarded` is true.

## 3. Theme catalog (code-defined)

New `src/domain/constants/profile-themes.ts`:

```ts
export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;                 // 0 = free, always owned
  colors: {
    background: [string, string]; // gradient start/end
    accent: string;               // name highlight, avatar ring, buttons
  };
}
```

- `DEFAULT_THEME_ID = "default"`.
- `PROFILE_THEMES`: `default` (price 0) + `sunset` (25) + `ocean` (40) + `midnight` (60) + `neon` (100).
- Helpers: `getProfileTheme(id): ProfileTheme` (falls back to default), `isDefaultTheme(id): boolean`.
- Final palettes chosen during implementation.

## 4. API routes

New directory `src/app/api/themes/`:

**`GET /api/themes`** — shop + user state in one call:
```
{ themes: ProfileTheme[], ownedThemeIds: string[], activeThemeId: string | null, coins: number }
```
The default theme is always present in `ownedThemeIds`. Auth required.

**`POST /api/themes/purchase`** — body `{ themeId }`:
1. Look up theme in catalog; unknown → `404 THEME_NOT_FOUND`.
2. Default theme or already owned → 200 no-op (idempotent).
3. `$transaction`: `User.updateMany` decrementing `coins` only if `coins >= price` (conditional update, atomic — no double-spend). 0 rows → `400 INSUFFICIENT_COINS`.
4. Insert `PurchasedTheme`. Return `{ balance, owned }`.

**`POST /api/themes/apply`** — body `{ themeId }`:
- Validate ownership (default is free-own); not owned → `403 THEME_NOT_OWNED`.
- Upsert `UserSettings.profileThemeId`. Return `{ activeThemeId }`.

All routes use `getAuthUserId()`, `successResponse`/`errorResponse`, and thin service logic in `src/application/services/themes.service.ts`.

## 5. UI

**Serving the theme to visitors:** `GET /api/users/[username]` joins `settings.profileThemeId` and returns `theme: ProfileTheme` (resolved via `getProfileTheme`). `ProfileData` (`src/components/profile/types.ts`) gains `theme?: ProfileTheme`.

**Applying the theme (`src/components/profile/ProfileView.tsx`):**
- The profile header card is styled with CSS variables: `--profile-bg-start`, `--profile-bg-end` → `background: linear-gradient(135deg, ...)`; `--profile-accent` → avatar ring, name highlight, and button colors.
- Implemented via inline `style` + a small scoped style block. No global CSS changes. Default theme renders visually identical to today.

**Own profile only — new `src/components/profile/ProfileThemeModal.tsx`:**
- Opened by a "Themes" button next to "Edit profile".
- Two tabs:
  - **Shop** — every theme as a card: gradient preview swatch, name, description, price, and a Buy button (disabled when owned or insufficient coins). Shows "Owned" state.
  - **Mine** — owned themes with an Apply button; the active one is highlighted.
- Coin badge (coin icon + balance) in the modal header and on the profile header so users always see their balance.
- After purchase: theme appears under Mine, balance updates live. After apply: profile re-renders with the new theme immediately.
- Coins and the Themes button appear only on your own profile; visitors just see the applied theme.

**Reward toast:** in `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`, when the `POST /api/history` response reports `rewarded: true`, show "You earned a coin!".

## 6. Error handling

| Scenario | Behavior |
|---|---|
| Buy unknown theme | `404 THEME_NOT_FOUND` |
| Buy with insufficient coins | `400 INSUFFICIENT_COINS` |
| Buy already-owned theme | 200 no-op (idempotent) |
| Apply unowned theme | `403 THEME_NOT_OWNED` |
| Forged `completed=true` for unread chapter | No reward — `ReadChapter` row must exist |
| Double completion / spam | No double-pay — `rewardedAt` guard |
| Two tabs buying simultaneously | Atomic conditional decrement prevents overspend |

## 7. Testing

Vitest, following the existing `*.service.test.ts` pattern (services testable with injected Prisma):

- `reward.service.test.ts`: completing an un-rewarded chapter pays 1 coin; repeating the same completion pays 0; missing `ReadChapter` pays 0.
- `themes.service.test.ts`: purchase decrements balance atomically; insufficient balance rejects; double purchase is idempotent; apply validates ownership; default theme always owned.

Route handlers stay thin — logic lives in the services.

## 8. Migration

- Create migration with `npm run db:migrate:create` (guarded, uses shadow DB).
- Apply with `npm run db:migrate`.

## 9. Files touched

- `prisma/schema.prisma` — schema changes + migration
- `src/domain/constants/profile-themes.ts` — new catalog
- `src/application/services/reward.service.ts` — new
- `src/application/services/themes.service.ts` — new
- `src/app/api/themes/route.ts` — new (GET catalog + state)
- `src/app/api/themes/purchase/route.ts` — new
- `src/app/api/themes/apply/route.ts` — new
- `src/app/api/history/route.ts` — reward hook
- `src/app/api/users/[username]/route.ts` — theme field
- `src/components/profile/ProfileView.tsx` — theme rendering, coin badge, Themes button
- `src/components/profile/ProfileThemeModal.tsx` — new shop/picker modal
- `src/components/profile/types.ts` — `ProfileTheme` on `ProfileData`
- `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx` — reward toast
- Tests: `reward.service.test.ts`, `themes.service.test.ts`
