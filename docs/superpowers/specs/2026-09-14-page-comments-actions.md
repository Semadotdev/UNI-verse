# Page Comments — Delete Confirmation & Report Actions (increment)

Date: 2026-09-14
Parent spec: `docs/superpowers/specs/2026-09-14-page-comments-design.md`
Status: Approved

## Goal

Add user-facing moderation actions to page comments: a delete confirmation
modal (for authors and admins) and a report action (for logged-in non-authors,
e.g. spoilers), reusing the app's existing `ConfirmModal` / `ReportModal`
primitives.

## Decisions

| Decision | Value |
|---|---|
| Entry point | Per-row icon buttons (flag + trash), Approach A from brainstorming |
| Delete confirm | Reuse `ConfirmModal`, one dialog for users and admins ("Delete this comment?") |
| Report UI | Reuse `ReportModal` (already POSTs `{ reason }` — matches `POST /api/page-comments/comment/{id}/report` verbatim) |
| Reported state | Disable re-report after a successful report; row shows a muted "Reported" label |
| Own comments | Report action hidden on own comments (backend already guards self-reports) |
| Logged-out | No actions shown (consistent with the hidden reply box) |
| Admin reports queue | Out of scope — `ReportsList` reads a different report model |

## API / Model

- `PageComment` entity + internal `PageCommentWithAuthor`: add
  - `reported: boolean` — viewer has reported this comment
  - `isOwn: boolean` — viewer authored this comment (entity does not expose `authorId`)
- `listByChapter`: build a `Set` from `prisma.pageCommentReport.findMany({ where: { reporterId } })`;
  map `reported = set.has(id)` for top-level and replies; `isOwn = c.authorId === viewerId`.
- `create`: returned comment gets `reported: false`, `isOwn: true`.
- No schema change (`PageCommentReport` already exists).

## UI

- `ReportModal`: add optional `onReported?: () => void`, called after successful
  submit (before `onClose`). Backwards compatible.
- `PageCommentPopover`:
  - **Report** (`Flag` icon — lucide): visible when `viewer` and `!comment.isOwn`;
    opens `ReportModal` with `url = /api/page-comments/comment/{id}/report`;
    `onReported` marks the comment reported locally (row shows muted "Reported" label, action disabled).
  - **Delete** (`Trash` icon — lucide): visible when `comment.canDelete`;
    opens `ConfirmModal` → on confirm calls existing delete + `onDeleted(id)` + "Comment deleted" toast.

## Files

- `src/domain/entities/page-comment.ts`
- `src/application/services/page-comment.service.ts` (+ tests)
- `src/components/posts/ReportModal.tsx`
- `src/components/reader/PageCommentPopover.tsx`

## Verification

`tsc --noEmit` clean; service tests extended (reported flag, isOwn, create shape);
`vitest run`; eslint on changed files.