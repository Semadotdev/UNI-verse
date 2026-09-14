# Plan: Page Comments — Y-Position Pins

Date: 2026-09-14
Status: Complete (all 12 tasks shipped on `feat/page-comments`)
Spec: `docs/superpowers/specs/2026-09-14-page-comments-design.md`

## Tasks

- **1. Schema + migration** — `PageComment` + `PageCommentReport` models, User/
  Notification relations, `pageCommentId` FK on Notification. Applied via
  `prisma migrate deploy` (shadow-DB `migrate dev` is broken in this repo).
  REVIEW: index changed to `[providerId, mangaId, chapterId, pageIndex, createdAt]`.
- **2. Entity + DTO** — `PageComment` interface, `CreatePageCommentInput`.
- **3. Clustering** — `clusterPageComments` → `PageCommentCluster[]`
  (`{ pageIndex, pageY, comments }`), tolerance 0.05. 6 tests.
- **4. Service** — `listByChapter`, `create`, `delete`, `report` + 15 tests.
  REVIEW: replies made optional; notification methods filled in.
- **5. Notifications** — `page_comment` / `page_reply` types +
  `onPageCommentCreated` (no-op) / `onPageCommentReplied` handlers.
- **6. API routes** — GET+POST by chapter, DELETE by id, POST report. tsc clean.
  (Verified inline — verbatim plan code, no separate review needed.)
- **7-9. UI components** — `PageCommentComposer`, `PageCommentPin`,
  `PageCommentPopover` (threads depth 2, reply/delete, timeAgo).
- **10. LongStripReader** — props `providerId/mangaId/chapterId/comments/viewer/
  onCommentCreated/onCommentDeleted`; long-press (500 ms, <10 px) → composer;
  pins hidden when zoomed; popover anchored at cluster Y. Dropped a
  `setActivePin` effect that tripped `react-hooks/set-state-in-effect`
  (behavior-preserving: render guard already hides stale pins).
- **11. Reader page** — fetch comments + viewer (`/api/me`, login-optional via
  catch→null) per chapter; append on create, filter on delete.
- **12. Verify** — `tsc --noEmit` clean; 177/178 tests pass (sole failure is the
  pre-existing, unrelated `reader-progress.test.ts` tied to an uncommitted
  `src/lib/reader-progress.ts` change); eslint clean on all feature files
  (3 pre-existing `<img>` warnings). Full-project `npm run lint` crashes on
  Playwright vendor bundles (pre-existing ESLint issue).

## Deviations / Notes

- Cluster tolerance stayed 0.05 (tests spread comments across that window).
- `onPageCommentCreated` logs the commentId (satisfies `no-unused-vars`).
- Rate limiting (RateLimitBucket 30/min) was designed but not wired — follow-up.
- `/api/me` already existed; reader page reuses it for the viewer.

## Commits (chronological)

`76b4c6a` `f67dafd` `dfce04b` `a040c4d` `cf154ed` `5f6c8d9` `843d4a2`
`79b3019` `898a74d` `1fffdbf` `da3aeaf` `600115a`