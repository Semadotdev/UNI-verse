# Design: Delete Account + Toast Visibility Fix

Date: 2026-08-23
Status: Approved

## Problem statements

1. Toasts are unreadable over light content: `Toast.tsx` variants use 10%-opacity
   backgrounds (`bg-green-500/10`) designed for the dark app theme. Over white manga
   pages (especially the coin reward toast in the reader) they are invisible.
2. Users cannot delete their own account, although the Terms of Service reference
   account deletion.

## Feature 1: Toast visibility

Replace translucent variant backgrounds with opaque dark surfaces plus a colored
left accent edge, keeping the existing container and close button:

| Variant | New classes |
|---|---|
| success | `bg-zinc-900 border-l-4 border-green-500 text-zinc-100` |
| error   | `bg-zinc-900 border-l-4 border-red-500 text-zinc-100` |
| warning | `bg-zinc-900 border-l-4 border-yellow-400 text-zinc-100` |
| info    | `bg-zinc-900 border-l-4 border-blue-500 text-zinc-100` |

Guarantees contrast over any reader background while preserving the app's dark
identity. Scope: all variants.

## Feature 2: Delete Account

Decisions: immediate hard delete; entry point inside the Profile editor modal;
type-to-confirm ("DELETE").

### Architecture

```
ProfileEditor "Danger Zone"
  -> ConfirmModal (confirmText="DELETE", async confirm)
  -> DELETE /api/me            (auth via getAuthUserId)
  -> AccountService.deleteAccount(userId)
       1) prisma.user.delete      -- all relations onDelete: Cascade
       2) supabase.auth.admin.deleteUser  -- service-role client, server-only
  -> client: supabase.auth.signOut() -> toast -> redirect "/"
```

Ordering rationale: DB-first keeps every failure recoverable.
- Prisma failure: nothing changed, user retries.
- Admin failure: DB rows already gone but the session still works; retry deletes the
  blank resurrected row (auto-created by `getAuthUserId`'s upsert) and re-attempts.
  Auth-first would instead lock the user out with data intact and no way to retry.

### Components

| Piece | Responsibility |
|---|---|
| `src/lib/supabase/admin.ts` | `getSupabaseAdminClient()` — `createClient` with `SUPABASE_SERVICE_ROLE_KEY`; throws when unset; never imported client-side |
| `src/application/services/account.service.ts` | Orchestrates the two deletions in order |
| `src/app/api/me/route.ts` DELETE handler | Auth guard + service call + standard error envelope |
| `src/components/posts/ConfirmModal.tsx` | Optional `confirmText` gate + async onConfirm with submitting state; backward compatible |
| `ProfileEditor.tsx` | Red-bordered Danger Zone card below Bio |

### Error handling

Route maps any thrown error to 500 `ACCOUNT_DELETE_ERROR`. Client surfaces a toast
on failure and leaves the modal usable for retry.

### Testing

- `account.service.test.ts`: mock prisma + admin client; assert call order,
  propagation of each failure mode before/after the other step.
- Full suite, typecheck, lint; manual E2E: throwaway account deleted -> login fails,
  data gone; toast readable over a white page.
