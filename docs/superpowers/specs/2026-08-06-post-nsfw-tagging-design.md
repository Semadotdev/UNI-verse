# Post NSFW Tagging — Design

**Date:** 2026-08-06
**Status:** Approved

## Goal

Users can tag posts as NSFW. Posts that attach a folder containing NSFW books are auto-tagged as NSFW. NSFW posts carry an "18+" badge, are visible only to 18+ users, and the posts feed gains an All / Friends / NSFW filter.

## Decisions (locked during brainstorming)

1. **NSFW detection:** genre-based — a folder is NSFW if any library item's `categories` intersect a canonical NSFW genre set. No schema change to `Library`.
2. **Age gate:** under-18 users never see NSFW posts — excluded from feeds, NSFW tab hidden, direct access returns 404. Server-enforced.
3. **Friends filter:** confirmed (mutual) friends only; the viewer's own posts are excluded. There is no "following" concept.
4. **Auto-tag behavior:** attaching an NSFW folder forces the tag ON (cannot be unchecked while that folder is attached). Users can always explicitly tag ON. Server recomputes on create/edit (`explicit || folderHasNsfw`).
5. **Display for 18+:** a red "18+" badge only. No blur.

## 1. Data model

- Add `nsfw Boolean @default(false)` to `Post` in `prisma/schema.prisma`. New migration.
- Add `nsfwExplicit Boolean @default(false)` to `Post` — tracks whether the tag is the user's explicit choice vs. auto-derived from an attached folder. This is required to implement the edit semantics in section 3 (a folder-derived tag must be able to turn OFF when the folder is swapped to clean content). `nsfw` is the effective flag used for filtering and the badge; `nsfwExplicit` preserves intent.
- `Post` entity (`src/domain/entities/post.ts`): add `nsfw: boolean`.
- `CreatePostInput`: add `nsfw?: boolean`.
- `UpdatePostInput`: add `nsfw?: boolean`.

## 2. NSFW detection (genre-based)

New shared constant + helper, e.g. `src/domain/constants/nsfw-genres.ts`:

```
NSFW_CATEGORIES = ['adult', 'ecchi', 'hentai', 'mature', 'ntr', 'smut', 'yaoi', 'yuri']
```

- Matching is case-insensitive (library `categories` come from providers and case varies).
- `isNsfwCategories(categories: string[]): boolean` — true if any category matches the set.
- `folderHasNsfw(folderId: string): Promise<boolean>` (in or near `PostService`) — queries the folder's `Library.items`, returns true if any item's `categories` intersect `NSFW_CATEGORIES`.

## 3. Server-side tagging (create / update)

`PostService.create` and `.update`:

```
explicit   = client-sent nsfw (create) | existing.nsfwExplicit if nsfw omitted (update)
effective  = explicit || folderHasNsfw(resolved folder)
nsfwExplicit = explicit
nsfw        = effective
```

- The server always computes this — the client cannot bypass by omitting the flag.
- Edit semantics: if the user swaps to a clean folder and never explicitly tagged (`nsfwExplicit` false), the post un-tags. Explicit tags persist across folder changes.
- The composer omits `nsfw` from the payload when the toggle is disabled by a forced NSFW folder, so folder-derived tags stay non-explicit.
- `toPost` maps `nsfw` into the `Post` entity.

## 4. Age gate (18+)

- Extract the age computation from `src/app/api/providers/route.ts` into a shared helper (e.g. `src/lib/age.ts`): `ageFromBirthDate(birthDate: Date): number` and `isAdult(birthDate: Date | null): boolean`.
- `/api/me` GET: include `birthDate` in the Prisma select and expose `isAdult: boolean` in the response. This is the single source the client uses to hide the NSFW tab.
- Server-side enforcement (minors never receive NSFW data):
  - `PostService.listFeed`: add `nsfw: false` to the Prisma `where` when the viewer is a minor.
  - `PostService.get(postId)`: if the post is NSFW and the viewer is a minor, throw a not-found error (404 — no existence leak).
  - `/api/posts/[id]/folder` (folder preview): same 404 gate, so minors cannot see NSFW books via a post's attached folder.
- Admin: the gate applies to everyone, consistent with the existing providers gate (no admin bypass).

## 5. Feed filters — All / Friends / NSFW

- `/api/posts` GET accepts `filter=all|friends|nsfw`. `PostService.listFeed` gains a `filter` option:
  - **all** (default): current world-wide feed. NSFW excluded for minors.
  - **friends**: `authorId IN (confirmed friends of viewer)`, own posts excluded. NSFW excluded for minors.
  - **nsfw**: `nsfw: true` only. Minors receive an empty result set (server-enforced; the tab is also hidden client-side).
- Confirmed friends are derived from the `Friend` model (rows exist in both directions for a mutual friendship).
- Posts page (`src/app/posts/page.tsx`):
  - `SegmentedControl` (All / Friends / NSFW) — reuse `src/components/ui/SegmentedControl.tsx`.
  - NSFW tab hidden when `!viewer.isAdult` (from `/api/me`).
  - Tab state mapped to `?filter=` URL param; changing the tab resets pagination (clear posts, page = 1).

## 6. Composer (manual tag + auto-tag)

- `PostComposer` gains a "Mark as NSFW (18+)" toggle.
- Auto-tag UX:
  - `/api/library/folders` response items gain a computed `nsfw: boolean` (from the folder's item categories), so the client knows immediately when a folder is selected. `LibraryService.getFolders` computes it.
  - Selecting an NSFW folder auto-checks the toggle and disables it (forced-on). The folder picker shows a small "NSFW" chip on NSFW folders.
- The server re-validates on publish regardless of the client state.

## 7. PostCard badge

- Reuse the existing red `NsfwBadge` component (`src/components/layout/Navbar.tsx` lines 32–36) — render it beside `timeAgo` when `post.nsfw`. No blur (decision 5).

## 8. Edge cases & notes

- Folder contents changing **after** posting does not retro-tag existing posts — `nsfw` is a snapshot taken at create/edit time. Accepted; noted as future hardening.
- `ProfileView` feed uses the same `/api/posts?username=` endpoint, so it inherits server-side filtering automatically; no UI change needed there (NSFW badge still renders for 18+ viewers).
- Empty state for minors on the NSFW filter: hidden tab means the filter is unreachable; server still guards the endpoint.
- 404 (not 403) for minor + NSFW post direct access avoids leaking that a post exists.

## Touchpoints

| File | Change |
| --- | --- |
| `prisma/schema.prisma` + migration | `Post.nsfw`, `Post.nsfwExplicit` columns |
| `src/domain/entities/post.ts` | `nsfw` on `Post`, `CreatePostInput`, `UpdatePostInput` |
| `src/domain/constants/nsfw-genres.ts` | NSFW category set + `isNsfwCategories` |
| `src/lib/age.ts` | `isAdult(birthDate)` helper |
| `src/application/services/post.service.ts` | `listFeed` filter + age gate, `create`/`update` effective nsfw, `folderHasNsfw`, `toPost` |
| `src/application/services/library.service.ts` | `getFolders` returns `nsfw` flag |
| `src/app/api/posts/route.ts` | accept `filter` param |
| `src/app/api/posts/[id]/route.ts` | accept `nsfw` on PATCH; age-gate GET |
| `src/app/api/posts/[id]/folder/route.ts` | age-gate |
| `src/app/api/me/route.ts` | expose `isAdult` |
| `src/app/api/library/folders/route.ts` | include `nsfw` in items |
| `src/components/posts/PostComposer.tsx` | NSFW toggle + forced auto-check |
| `src/components/posts/PostCard.tsx` | "18+" badge |
| `src/app/posts/page.tsx` | All / Friends / NSFW filter |
| Tests | NSFW detection, filter logic, age gate, folder auto-tag |

## Testing

The repo has no test framework; add **vitest** (node environment, `@/` alias) and a `test` script. Cover:

- `isNsfwCategories`: case-insensitivity, boundary genres.
- `isAdult` / `ageFromBirthDate`: null birthDate is not adult (fail closed), boundary at 18.
- `buildFeedWhere` (pure feed-where builder): each filter (all / friends / nsfw) × minor vs adult.
- `PostService` (prisma mocked): `get` age gate (minor + NSFW → null/404), `create` folder auto-tag + explicit tag, `update` edit semantics (auto-tagged un-tags on clean swap, explicit persists), `listFeed` minor `nsfw: false` and friends filter.
- Composer: NSFW toggle auto-checks and disables on NSFW folder selection (manual verification).
