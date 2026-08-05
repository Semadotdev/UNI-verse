# Folder Sharing via Public Links — Design

Date: 2026-08-05
Status: Approved

## Problem

Users want to share a folder from their library with other people. The recipient should be able to view the folder's contents without an account and save interesting titles into their own library.

## Requirements

1. Any folder in the library can be shared via a unique public link.
2. The shared link is viewable without logging in.
3. Logged-in viewers can save a shared folder's manga into their own library.
4. The owner controls sharing from the folder ⋮ menu on the Library page: create link, copy link, stop sharing.
5. Revoking or deleting the folder makes the link return a "not found" state.

## Non-goals

- Sharing the whole collection (folders only).
- Inviting specific users (public link only).
- Editing shared content (view + save only).
- Versioned/snapshotted shares (contents update live).

## Data model

Add `SharedFolder` model to `prisma/schema.prisma`:

```prisma
model SharedFolder {
  id        String   @id @default(cuid())
  folderId  String   @unique
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  folder    Folder   @relation(fields: [folderId], references: [id], onDelete: Cascade)
}
```

`Folder` gains a back-relation `shared SharedFolder?`. Deleting a folder cascades to its share row, so the token becomes invalid. The token is a random hex string (`crypto.randomUUID()`), which is unguessable enough for link sharing.

## Service layer

New `SharedService` in `src/application/services/shared.service.ts` (mirrors `LibraryService` / `HistoryService` style):

- `getShare(folderId, userId)` — returns existing share (`{ token, url }`) or null. Validates folder ownership.
- `enableShare(folderId, userId)` — idempotent: returns existing share or creates one with a new token.
- `disableShare(folderId, userId)` — deletes the share row if the folder belongs to the user.
- `getSharedFolder(token)` — public, no auth. Loads the folder + owner (`folder.user`) + library items for that folder, mapped to `{ folderName, ownerName, items }` where each item carries `providerId, mangaId, title, coverUrl, categories`.

## API routes

Owner (auth via `getAuthUserId()`):
- `GET /api/library/folders/[id]/share` — existing share or null.
- `POST /api/library/folders/[id]/share` — create (idempotent), returns `{ token, url }`.
- `DELETE /api/library/folders/[id]/share` — revoke.

Public (no auth):
- `GET /api/shared/[token]` — folder + items, or 404 when the token is unknown.

All responses use the existing `successResponse` / `errorResponse` helpers.

## Middleware

Add `/s` to `publicRoutes` in `src/middleware.ts` so logged-out visitors can view shared pages. All other protections are unchanged.

## Pages / components

### Public viewer — `src/app/s/[token]/page.tsx` (new, client)

- Reads the token via React 19 `use(params)`.
- Fetches `/api/shared/[token]` on mount.
- Header: folder name, owner username, item count.
- Grid of existing `MangaCard`s. Covers load through the existing public `/api/image` proxy.
- Loading → skeleton grid; 404 → "This shared folder doesn't exist or was unshared".
- Checks login state via `getSupabaseBrowserClient().auth.getUser()`. When logged in, renders a ＋ "Add to library" button per card (hidden when already in the viewer's library), toast on success. Card clicks to open/read remain behind the existing auth gate.

### `MangaCard` — add optional `onAdd` prop

Mirrors the existing `onRemove` overlay button: a small ＋ button in the top-left corner that stops navigation and calls `onAdd`.

### Library page — share controls

- Third item in the folder ⋮ modal (between Rename and Delete): **Share**.
- Opens a share modal for that folder:
  - Not shared: "Create share link" button → `POST`.
  - Shared: readonly link input + **Copy** (`navigator.clipboard`, toast feedback) + **Stop sharing** (`DELETE` → returns to the create state).

## Trade-offs accepted

- Public links expose folder titles and covers (including NSFW provider content) to anyone holding the token.
- Shared contents update live as the owner edits the folder; no snapshotting.

## Verification

No test suite exists. Verify with `npm run lint` → `npm run typecheck` → `npm run build`.

## Files touched

- `prisma/schema.prisma` (+ regenerate client, `npm run db:push`)
- `src/application/services/shared.service.ts` (new)
- `src/app/api/library/folders/[id]/share/route.ts` (new)
- `src/app/api/shared/[token]/route.ts` (new)
- `src/middleware.ts`
- `src/app/s/[token]/page.tsx` (new)
- `src/components/manga/MangaCard.tsx`
- `src/app/library/page.tsx`

No new dependencies.
