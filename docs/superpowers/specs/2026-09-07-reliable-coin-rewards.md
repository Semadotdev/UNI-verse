# Reliable Coin Rewards Design

**Date:** 2026-09-07

## Problem

Completing a chapter grants 1 coin (first completion only). Today both the coin credit AND the "You earned a coin!" toast depend on the completion POST round-trip in the reader (`src/app/read/[providerId]/[mangaId]/[...chapterPath]/page.tsx`). When the request fails before reaching the server (flaky connection), the coin is lost and the toast never appears. Users report chapters "not giving coins." Re-reads correctly produce no reward but read as a bug.

## Goal

- Show the coin notification immediately when a chapter is completed (optimistic).
- Guarantee the coin credit is processed in the background so it never fails due to page navigation or connection drops.
- Keep the reward once-per-chapter, first-completion-only, with no duplicate credits.

## Design

### Client-side durable reward queue (`src/lib/reward-queue.ts`, new)

localStorage-backed, two keys:

- `reward-queue:v1` — array of pending completion `RewardJob`s.
- `reward-claimed:v1` — array of chapter keys already claimed on this device (grows up to 500, oldest dropped).

Functions:

- `claimChapterReward({ providerId, mangaId, chapterId, chapterNum, title, coverUrl })` → `{ shown: boolean }`
  - Sync. If the chapter key is already in the claimed set, returns `{ shown: false }` (re-read; caller shows no toast). Otherwise: mark claimed, append a `RewardJob` (`progress: 100`, `completed: true`, `key = providerId/mangaId/chapterId`), cap the queue at 50 jobs (drop oldest), fire `flushRewardQueue()` without awaiting, return `{ shown: true }`.
  - If localStorage writes fail (unavailable/quota), falls back to a direct fire-and-forget `POST /api/history` (current behavior) and still returns `{ shown: true }`.
- `flushRewardQueue()` → `Promise<void>`
  - Single-flight (module-level `flushing` guard). For each pending job: `POST /api/history` with the same body the old completion path sent (`keepalive: true`). Any resolved response → drop the job (the server's `rewardedAt` transaction already deduped). Network/HTTP error → keep the job for a later flush.
- `registerRewardFlusher()` → cleanup fn
  - Flushes on mount, on `window` `online`, and on `visibilitychange` when the tab becomes visible. Returns a cleanup that removes listeners.

### Server

Unchanged. `POST /api/history` already: records history via upsert and grants the reward inside a `$transaction` gated on `rewardedAt: null`, returning `{ rewarded, balance }`. Retries are therefore safe (no double credit).

### Integration (`src/components/Providers.tsx`)

Call `registerRewardFlusher()` once in a `useEffect` (client component, wraps the whole app).

### Reader completion path (`page.tsx`)

On completion, replace `postProgress(true)` + `.then(res => res.rewarded && addToast(...))` with:

```tsx
if (completed) {
  if (completionPostedForRef.current === chapterId) return;
  completionPostedForRef.current = chapterId;
  const { shown } = claimChapterReward({
    providerId, mangaId, chapterId,
    chapterNum: currentChapter.number,
    title: mangaDetails.title,
    coverUrl: mangaDetails.cover,
  });
  if (shown) addToast("You earned a coin!", "success");
  return;
}
```

Non-completed progress updates keep the debounced `POST /api/history` with `completed: false`.

## Behavior Matrix

| Scenario | Toast | Coin |
| --- | --- | --- |
| First completion, online | Immediate | Granted in background |
| First completion, offline | Immediate | Granted when connection returns (queue persisted) |
| Re-read, same device | None | None (once per chapter) |
| Re-read, fresh device | May show once | Not granted (server no-op); claimed set self-corrects |

## Out of Scope

Rewarding re-reads, daily caps, server-side pending-credit table, changes to reward value or the once-per-chapter policy.

## Testing

- vitest unit tests for `reward-queue` (node env, stubbed `localStorage`, spied `ApiClient.post`):
  - claim first time → `shown: true`, job queued, claimed set seeded.
  - claim again → `shown: false`, no duplicate job.
  - flush success → job removed, claimed set retained.
  - flush with server returning `rewarded: false` → job removed.
  - flush network failure → job retained.
  - queue capped at 50 jobs.
  - localStorage write failure → still `shown: true`, fallback POST fired.
- Manual: complete a chapter with devtools offline → toast appears; reconnect → coin credited once (verify via profile), no duplicate.