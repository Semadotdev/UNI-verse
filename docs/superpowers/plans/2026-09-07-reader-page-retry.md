# Reader Page Retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users reload a single failed page image in the reader (paged + long-strip) without reloading the whole page.

**Architecture:** Each reader tracks per-page `failed`/`retryCount` state. `onError` marks a page failed and renders a Retry overlay; clicking Retry bumps a per-page counter that becomes a cache-busting `r=N` query param on the proxy URL (`/api/image?url=…&headers=…&r=N`), forcing a fresh server fetch. Failures are never cached by the proxy (`image-proxy.ts` only caches successes), so a retry genuinely re-hits upstream.

**Tech Stack:** React 19 + Next.js 16 (client components), vitest.

---

### Task 1: URL-building helper with cache-busting

**Files:**
- Create: `src/lib/reader-page-image.ts`
- Test: `src/lib/reader-page-image.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildPageImageUrl } from "./reader-page-image";
import type { Page } from "@/domain/entities/page";

describe("buildPageImageUrl", () => {
  it("uses the proxy URL without a retry param by default", () => {
    const url = buildPageImageUrl({ index: 0, url: "https://cdn.example.com/a.jpg" }, 0);
    expect(url.startsWith("/api/image?url=")).toBe(true);
    expect(url).not.toContain("r=");
  });

  it("appends a cache-busting retry param for proxied pages", () => {
    const url = buildPageImageUrl({ index: 0, url: "https://cdn.example.com/a.jpg" }, 2);
    expect(url).toContain("r=2");
  });

  it("returns the direct URL untouched for direct pages", () => {
    const page: Page = { index: 0, url: "https://cdn.example.com/a.jpg", direct: true };
    expect(buildPageImageUrl(page, 3)).toBe("https://cdn.example.com/a.jpg");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/reader-page-image.test.ts`
Expected: FAIL — module/fn not found.

- [ ] **Step 3: Implement the helper**

```ts
import { ApiClient } from "@/lib/api-client";
import type { Page } from "@/domain/entities/page";

export function buildPageImageUrl(page: Page, retryCount: number): string {
  if (page.direct) return page.url;
  const base = ApiClient.imageUrl(page.url, page.headers);
  if (retryCount > 0) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}r=${retryCount}`;
  }
  return base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/reader-page-image.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader-page-image.ts src/lib/reader-page-image.test.ts
git commit -m "feat: add builder for image url with per-page retry cache-bust"
```

---

### Task 2: Retry overlay in PagedReader

**Files:**
- Modify: `src/components/reader/PagedReader.tsx`

Import `buildPageImageUrl` (replace the direct use of `ApiClient` for URL building; `ApiClient` import can be removed if no longer used — it is only used for `imageUrl`).

- [ ] **Step 1: Add per-page failure state** (after `imageLoaded` state)

```tsx
const [failed, setFailed] = useState<Record<number, boolean>>({});
const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
```

- [ ] **Step 2: Add the retry handler and switch to the retry-aware URL**

```tsx
  if (pages.length === 0) return null;

  const page = pages[currentPage];
  const imageUrl = buildPageImageUrl(page, retryCounts[currentPage] ?? 0);

  const handleRetry = () => {
    setFailed((prev) => ({ ...prev, [currentPage]: false }));
    setImageLoaded((prev) => ({ ...prev, [currentPage]: false }));
    setRetryCounts((prev) => ({ ...prev, [currentPage]: (prev[currentPage] ?? 0) + 1 }));
  };
```

- [ ] **Step 3: Wire `onError`/`onLoad` on the `<img>`**

```tsx
        onLoad={() => {
          setImageLoaded((prev) => ({ ...prev, [currentPage]: true }));
          setFailed((prev) => ({ ...prev, [currentPage]: false }));
        }}
        onError={() => setFailed((prev) => ({ ...prev, [currentPage]: true }))}
```

- [ ] **Step 4: Render the failed overlay** (inside the root div, after the `<img>`)

```tsx
      {failed[currentPage] && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-sm text-muted mb-4">Failed to load page {currentPage + 1}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Verify** — `npx tsc --noEmit`; `npm run lint`
- [ ] **Step 6: Commit**

```bash
git add src/components/reader/PagedReader.tsx
git commit -m "feat: add retry overlay for failed pages in paged reader"
```

---

### Task 3: Retry overlay in LongStripReader

**Files:**
- Modify: `src/components/reader/LongStripReader.tsx`

- [ ] **Step 1: Add per-page failure state**

```tsx
const [failed, setFailed] = useState<Record<number, boolean>>({});
const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
```

- [ ] **Step 2: Rewrite the page render loop**

```tsx
      {pages.map((page, i) => {
        const retryCount = retryCounts[i] ?? 0;
        const imageUrl = buildPageImageUrl(page, retryCount);
        return (
          <div
            key={page.index}
            data-index={i}
            className="w-full relative"
            onClick={() => handleDoubleTap(i)}
          >
            <img
              src={imageUrl}
              alt={`Page ${i + 1}`}
              loading={i < settings.pagePreloadCount ? "eager" : "lazy"}
              className={failed[i] ? "hidden" : "w-full h-auto"}
              style={failed[i] ? undefined : {
                opacity: loaded[i] ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
                filter: `brightness(${settings.brightness})`,
                transform: zoomedPage === i ? "scale(1.5)" : undefined,
                transformOrigin: "top center",
              }}
              onLoad={() => {
                setLoaded((prev) => ({ ...prev, [i]: true }));
                setFailed((prev) => ({ ...prev, [i]: false }));
              }}
              onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
            />
            {failed[i] && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
                <p className="text-sm text-muted mb-4">Failed to load page {i + 1}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFailed((prev) => ({ ...prev, [i]: false }));
                    setLoaded((prev) => ({ ...prev, [i]: false }));
                    setRetryCounts((prev) => ({ ...prev, [i]: (prev[i] ?? 0) + 1 }));
                  }}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        );
      })}
```

- [ ] **Step 3: Update the import** — add `import { buildPageImageUrl } from "@/lib/reader-page-image";` and remove the now-unused `ApiClient` import (its only use was the direct URL builder).

- [ ] **Step 4: Verify** — `npx tsc --noEmit`; `npm run lint`
- [ ] **Step 5: Commit**

```bash
git add src/components/reader/LongStripReader.tsx
git commit -m "feat: add retry overlay for failed pages in long-strip reader"
```

---

### Task 4: Full verification

- [ ] **Step 1:** `npm test` — all suites pass.
- [ ] **Step 2:** `npm run lint` and `npx tsc --noEmit` — clean.
- [ ] **Step 3:** Manual check in `npm run dev`: open a chapter (paged + long-strip), simulate failure via devtools (block/offline `/api/image`), confirm overlay + retry restores the single page without reloading.