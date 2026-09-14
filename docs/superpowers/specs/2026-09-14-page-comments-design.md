# Page Comments (Y-Position Pins) — Design Spec

Date: 2026-09-14
Status: Approved (3 sections), implemented on `feat/page-comments`

## Goal

Let readers comment on a specific part of a manhwa page while reading the
long-strip reader. A comment is pinned at a vertical position (Y) on the page;
pins show as edge circles with counts; tapping a pin opens a threaded popover.

## Approach

Separate `PageComment` model (approach B from ideation). Long-press on a page
creates a new comment at that spot; comments at nearby Y-positions cluster into
a single pin.

## User Stories

1. While reading, I long-press a page to open a composer anchored at that Y
   position (shown as "N% down"). Submit → a new pin appears.
2. I tap an edge-circle pin to see the cluster's comments in a popover, with
   replies nested up to depth 2.
3. I can delete my own comments (admins can delete any).
4. I can report spammy comments.
5. If I'm logged out, long-press shows a "Log in to comment" prompt.
6. Pins are hidden while a page is zoomed (double-tap zoom).

## Design Decisions

| Decision | Value |
|---|---|
| `pageY` | Float 0–1 ratio of page height (doc-commented in schema) |
| Clustering tolerance | ±0.05 (5% of page height); cluster Y = running average of members |
| Pin marker | 28×28 circle, `right-1`, `top: pageY%`, `translateY(-50%)`, shows count (or `+` for 0) |
| Long-press | 500 ms press with <10 px movement. Double-tap zoom unchanged |
| Composer | Centered modal overlay, "Comment on page N · M% down", Ctrl/Cmd+Enter to send |
| Popover | `right-10`, `top: pageY%`, `translateY(-50%)`, max-h-96 scrollable, thread depth 2 |
| Privacy | Public — same as post comments; sorted chronologically |
| Notifications | `page_comment` (no-op hook, no owner) + `page_reply` (notifies parent author, self-reply guarded) |
| Rate limiting | Reuse RateLimitBucket, 30/min (design note; not yet wired) |
| Deletion | Author or admin; replies cascade (Prisma onDelete) |

## Data Model

- `PageComment`: `id`, `providerId`, `mangaId`, `chapterId`, `pageIndex`,
  `pageY`, `body`, `authorId`, `parentId?`, `createdAt`, `reports`, `notifications`.
  Unique index: `[providerId, mangaId, chapterId, pageIndex, createdAt]`.
- `PageCommentReport`: `id`, `commentId`, `reporterId`, `reason`, composite
  unique `(commentId, reporterId)`; upsert-based.
- `Notification`: `pageCommentId?` FK (SetNull), `type: 'page_comment' | 'page_reply'`.

## API

- `GET /api/page-comments/{providerId}/{mangaId}/{chapterId}` → clusters as
  `PageComment[]` with author + replies.
- `POST /api/page-comments/{providerId}/{mangaId}/{chapterId}` body
  `{ body, pageIndex, pageY, parentId? }` → `PageComment` (201).
- `DELETE /api/page-comments/comment/{id}` (author/admin; 403 otherwise).
- `POST /api/page-comments/comment/{id}/report` body `{ reason? }` → 201.

## Files

- `prisma/schema.prisma` + migrations `20260914000000_add_page_comments`,
  `20260914000001_page_comment_index`
- `src/domain/entities/page-comment.ts`, `src/application/dto/page-comment.dto.ts`
- `src/lib/pin-clustering.ts` (+ tests)
- `src/application/services/page-comment.service.ts` (+ tests)
- `src/application/services/notification.service.ts`, `src/domain/entities/notification.ts`
- 3 API route files under `src/app/api/page-comments/`
- `src/components/reader/PageCommentComposer.tsx`, `PageCommentPin.tsx`,
  `PageCommentPopover.tsx`, `LongStripReader.tsx`
- `src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`