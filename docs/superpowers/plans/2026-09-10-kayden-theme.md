# Kayden's Rooftop Webtoon Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium "Kayden's Rooftop" profile theme — a light, webtoon-style rooftop scene with the user's animated orange tabby (Kayden) in a corner sticker overlapping the profile card, plus panel treatments on the stats row and Posts section.

**Architecture:** The theme entry gets `animation: { kind: "webtoon" }` (rendered through the existing `renderLayers` switch inside `.theme-bg`) plus a new optional `character: { src, poster }` field. `ProfileThemeBackground` renders the character as a **sibling** of `.theme-bg` (not inside it — `.theme-bg` is `overflow: hidden` and would clip the sticker), absolutely positioned to overlap the card's top-right corner. The profile card switches to `overflow-visible` when the theme has a character, and a `profile-theme-webtoon` wrapper class drives CSS-only section treatments.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Vitest, PIL (Python image processing), vanilla CSS keyframes.

**Spec:** `docs/superpowers/specs/2026-09-10-kayden-theme-design.md`

---

### Task 1: Generate the optimized character assets

**Files:**
- Create: `public/themes/kayden.gif` (animated sticker, target ≤ 350 KB)
- Create: `public/themes/kayden-poster.png` (static frame 0, reduced-motion fallback)
- Create: `public/themes/README.md`

- [ ] **Step 1: Write the processing script**

**Write** `/tmp/uni-verse-kayden/process.py`:

```python
import os
from PIL import Image, ImageSequence

SRC = "/home/jiromanalo/Projects/UNI-verse/public/Kayden.gif"
OUT_DIR = "/home/jiromanalo/Projects/UNI-verse/public/themes"
CROP = (60, 50, 1020, 1080)   # cat region inside the 1080x1080 sheet
TARGET_W = 512                 # downscale width
SUBSAMPLE_FRAMES = 24

os.makedirs(OUT_DIR, exist_ok=True)
im = Image.open(SRC)
frames = list(ImageSequence.Iterator(im))
step = max(1, len(frames) // SUBSAMPLE_FRAMES)
sel = list(frames[0::step])
if sel[-1] is not frames[-1]:
    sel.append(frames[-1])
duration = max(33, round(30 * step))

def norm(f):
    return f.convert("RGBA").crop(CROP)

regions = [norm(f) for f in sel]
scale = TARGET_W / regions[0].width
small = [r.resize((TARGET_W, int(r.height * scale)), Image.LANCZOS) for r in regions]

small[0].save(
    os.path.join(OUT_DIR, "kayden.gif"),
    save_all=True, append_images=small[1:],
    duration=duration, loop=0, optimize=True, dispose=2,
)

poster = small[0].convert("P", palette=Image.ADAPTIVE, colors=128)
poster.save(os.path.join(OUT_DIR, "kayden-poster.png"), optimize=True)

gif_size = os.path.getsize(os.path.join(OUT_DIR, "kayden.gif"))
png_size = os.path.getsize(os.path.join(OUT_DIR, "kayden-poster.png"))
print("kayden.gif:", small[0].size, gif_size, "bytes,", len(small), "frames,", duration, "ms/frame")
print("kayden-poster.png:", poster.size, png_size, "bytes")
assert gif_size <= 350_000, "gif too large: %d" % gif_size
print("OK - assets within budget")
```

- [ ] **Step 2: Run the script**

Run: `python3 /tmp/uni-verse-kayden/process.py`

Expected: both assets written with sizes printed and `OK - assets within budget`. If the assert fails, lower `TARGET_W` to `384` and re-run.

- [ ] **Step 3: Write the credit note**

**Write** `public/themes/README.md`:

```markdown
# Theme assets

## Kayden's Rooftop

`kayden.gif` / `kayden-poster.png` are optimized derivatives of `public/Kayden.gif`,
the site owner's original animated cat (Kayden Break, cat form) asset. Kept near-white
background on purpose: the white fur must not be chroma-keyed out.
```

- [ ] **Step 4: Commit**

Run:
```bash
git add public/themes/kayden.gif public/themes/kayden-poster.png public/themes/README.md
git commit -m "chore: add kayden rooftop theme assets"
```

---

### Task 2: Add the `webtoon` kind, `character` field, and theme entry (TDD)

**Files:**
- Modify: `src/domain/constants/profile-themes.ts`
- Test: `src/domain/constants/profile-themes.test.ts`

- [ ] **Step 1: Update tests (expected to fail)**

In `src/domain/constants/profile-themes.test.ts`:

1. Add `"webtoon"` to `ANIMATED_KINDS`:

```ts
  const ANIMATED_KINDS = ["aurora", "stardust", "embers", "waves", "neon", "matrix", "webtoon"];
```

2. Extend the "gives every animated theme valid config" test's `if` blocks:

```ts
      if (a.kind === "matrix") expect(a.columnCount).toBeGreaterThan(0);
      if (a.kind === "webtoon") expect(a.cloudCount).toBeGreaterThan(0);
```

3. Append a new describe block after the "animated theme catalog" block:

```ts
describe("webtoon character theme", () => {
  it("has a kayden entry priced at 300 with webtoon animation", () => {
    const t = getProfileTheme("kayden");
    expect(t?.price).toBe(300);
    expect(t?.animation?.kind).toBe("webtoon");
  });

  it("uses a warm webtoon palette", () => {
    const t = getProfileTheme("kayden");
    expect(t?.colors.background[0]).toBe("#a9d6ef");
    expect(t?.colors.background[1]).toBe("#fbeecf");
    expect(t?.colors.accent).toBe("#463524");
  });

  it("points character art at precached theme assets", () => {
    const t = getProfileTheme("kayden");
    expect(t?.character?.src.startsWith("/themes/")).toBe(true);
    expect(t?.character?.poster.startsWith("/themes/")).toBe(true);
  });

  it("only marks kayden as a character theme", () => {
    for (const t of PROFILE_THEMES) {
      if (t.id === "kayden") continue;
      expect(t.character).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`

Expected: FAIL — `getProfileTheme("kayden")` is `undefined` and `"webtoon"` is not contained in `ANIMATED_KINDS`.

- [ ] **Step 3: Add `webtoon` to the union, `character` to the interface, and the entry**

In `src/domain/constants/profile-themes.ts`:

1. Add the `webtoon` member to `ThemeAnimation`:

```ts
  | { kind: "matrix"; columnCount: number }
  | { kind: "webtoon"; cloudCount: number };
```

2. Add `character` to `ProfileTheme`:

```ts
  animation?: ThemeAnimation;
  character?: { src: string; poster: string };
```

3. Append the entry at the end of `PROFILE_THEMES` (after `digitalrain`):

```ts
  {
    id: "kayden",
    name: "Kayden's Rooftop",
    description: "A sun-soaked rooftop in a webtoon, with your favorite orange tabby watching over it.",
    price: 300,
    colors: { background: ["#a9d6ef", "#fbeecf"], accent: "#463524" },
    animation: { kind: "webtoon", cloudCount: 3 },
    character: { src: "/themes/kayden.gif", poster: "/themes/kayden-poster.png" },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`

Expected: PASS (catalog, animated catalog, and webtoon character theme blocks).

- [ ] **Step 5: Commit**

Run:
```bash
git add src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts
git commit -m "feat: add kayden's rooftop webtoon theme entry"
```

---

### Task 3: Render the webtoon background, character sticker, and their CSS

**Files:**
- Modify: `src/components/profile/ProfileThemeBackground.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Switch `renderLayers` to receive colors, add the `webtoon` branch**

In `src/components/profile/ProfileThemeBackground.tsx`:

1. Add a sparkle-position constant above the component (after `MATRIX_GLYPHS`):

```tsx
const WEBTOON_SPARKS = [
  { left: "22%", top: "28%", duration: 3.2, delay: -1.1 },
  { left: "72%", top: "20%", duration: 2.6, delay: -2.2 },
  { left: "48%", top: "62%", duration: 2.9, delay: -0.4 },
] as const;
```

2. Change the `renderLayers` signature and the one accent consumer:

```tsx
function renderLayers(
  animation: ThemeAnimation,
  colors: ProfileTheme["colors"]
): React.ReactNode {
  switch (animation.kind) {
    ...
    case "neon":
      return (
        <>
          <div
            className="theme-neon"
            style={{ animationDuration: `${animation.duration}s` } as CSSProperties}
          />
          <div
            className="theme-neon-ring"
            style={{ borderColor: colors.accent } as CSSProperties}
          />
        </>
      );
```

3. Add the `webtoon` case before the switch closes (`}` after `case "matrix"` block — you will replace the closing of the `matrix` case's `return`/`Array` then add `}` for the switch):

```tsx
    case "matrix":
      return Array.from({ length: animation.columnCount }, (_, i) => (
        <div
          key={i}
          className="theme-matrix-col"
          style={
            {
              left: `${Math.round(4 + i * (90 / animation.columnCount))}%`,
              animationDuration: `${(4 + hash(i, 2) * 3).toFixed(2)}s`,
              animationDelay: `${-(hash(i, 3) * 5).toFixed(2)}s`,
            } as CSSProperties
          }
        >
          {MATRIX_GLYPHS}
        </div>
      ));

    case "webtoon":
      return (
        <>
          <div
            className="theme-webtoon-sky"
            style={{
              background: `linear-gradient(180deg, ${colors.background[0]} 0%, #eef7fb 55%, ${colors.background[1]} 100%)`,
            }}
          />
          <div className="theme-webtoon-sun" />
          <div className="theme-webtoon-rays" />
          {Array.from({ length: animation.cloudCount }, (_, i) => (
            <div
              key={i}
              className="theme-webtoon-cloud"
              style={
                {
                  "--cx": `${[18, 62, 38][i]}%`,
                  "--cd": `${[26, 34, 40][i]}s`,
                  "--cdd": `${[0, -8, -20][i]}s`,
                } as CSSProperties
              }
            />
          ))}
          <div className="theme-webtoon-halftone" />
          <div className="theme-webtoon-grain" />
          {WEBTOON_SPARKS.map((sp, i) => (
            <div
              key={"s" + i}
              className="theme-webtoon-spark"
              style={
                {
                  left: sp.left,
                  top: sp.top,
                  animationDuration: `${sp.duration}s`,
                  animationDelay: `${sp.delay}s`,
                } as CSSProperties
              }
            />
          ))}
          <div className="theme-webtoon-speed" />
          <span className="theme-webtoon-annot">purr~</span>
        </>
      );
  }
}
```

- [ ] **Step 2: Update the component: guard, light-mode overlay, sticker sibling**

Replace the whole `ProfileThemeBackground` function body with:

```tsx
export function ProfileThemeBackground({ theme, className }: ProfileThemeBackgroundProps) {
  if (!theme.animation && !theme.character) return null;
  const lightBg = theme.animation?.kind === "webtoon";
  return (
    <>
      <div aria-hidden className={"theme-bg" + (className ? " " + className : "")}>
        {!lightBg && <div className="absolute inset-0 bg-black/25" />}
        {theme.animation && renderLayers(theme.animation, theme.colors)}
      </div>
      {theme.character && (
        <div
          aria-hidden
          className="theme-sticker"
          style={{ borderColor: theme.colors.accent }}
        >
          <img className="theme-sticker-gif" src={theme.character.src} alt="" draggable={false} />
          <img className="theme-sticker-poster" src={theme.character.poster} alt="" draggable={false} />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Add the webtoon CSS block to globals.css**

In `src/app/globals.css`, insert after `.theme-matrix-col` (line 567) and **before** the `@media (prefers-reduced-motion: reduce)` block (line 569):

```css
/* Kayden's Rooftop (webtoon) */
@keyframes theme-cloud-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(34px); }
}
@keyframes theme-speed-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.65; }
}
.theme-webtoon-sky {
  position: absolute;
  inset: 0;
}
.theme-webtoon-sun {
  position: absolute;
  top: 12px;
  right: 12%;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 224, 130, 0.8) 0%, rgba(255, 224, 130, 0) 70%);
}
.theme-webtoon-rays {
  position: absolute;
  inset: 0;
  mix-blend-mode: soft-light;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 243, 200, 0.5) 46%, transparent 52%),
    linear-gradient(155deg, transparent 45%, rgba(255, 243, 200, 0.35) 51%, transparent 57%);
}
.theme-webtoon-cloud {
  position: absolute;
  left: var(--cx);
  top: 20%;
  width: 120px;
  height: 34px;
  border-radius: 999px;
  background: #fff;
  opacity: 0.65;
  filter: blur(3px);
  animation: theme-cloud-drift var(--cd) ease-in-out infinite alternate;
  animation-delay: var(--cdd);
}
.theme-webtoon-cloud:nth-child(3) { top: 48%; opacity: 0.5; }
.theme-webtoon-cloud:nth-child(4) { top: 8%; opacity: 0.4; }
.theme-webtoon-halftone {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background-image: radial-gradient(rgba(70, 53, 36, 0.55) 1px, transparent 1.4px);
  background-size: 14px 14px;
}
.theme-webtoon-grain {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  mix-blend-mode: multiply;
  background-image: repeating-conic-gradient(rgba(70, 53, 36, 0.05) 0 0.0001%, transparent 0 0.0002%);
}
.theme-webtoon-spark {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8b04b;
  box-shadow: 0 0 8px #e8b04b;
  animation: theme-star-twinkle 3s ease-in-out infinite;
}
.theme-webtoon-speed {
  position: absolute;
  top: 6%;
  right: 10%;
  width: 90px;
  height: 90px;
  background: repeating-linear-gradient(135deg, transparent 0 9px, rgba(70, 53, 36, 0.18) 9px 11px);
  transform: rotate(-12deg);
  animation: theme-speed-pulse 4s ease-in-out infinite;
}
.theme-webtoon-annot {
  position: absolute;
  left: 8%;
  bottom: 4%;
  font-style: italic;
  font-size: 12px;
  color: rgba(70, 53, 36, 0.45);
  opacity: 0.85;
}

/* Character sticker (corner overlap) */
.theme-sticker {
  position: absolute;
  z-index: 5;
  top: -12px;
  right: -8px;
  width: clamp(34px, 30%, 128px);
  aspect-ratio: 96 / 103;
  padding: 5px;
  background: #fff;
  border: 2.5px solid #463524;
  border-radius: 14px;
  box-shadow: 0 5px 12px rgba(70, 53, 36, 0.28);
  pointer-events: none;
}
.theme-sticker img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 9px;
}
.theme-sticker-poster { display: none; }
/* rounded corners stay rounded when the card turns overflow-visible */
.theme-sticker-card .theme-bg { border-radius: inherit; }
```

- [ ] **Step 4: Extend the reduced-motion block**

Change the reduced-motion block at the end of the file (lines 569-571) to:

```css
@media (prefers-reduced-motion: reduce) {
  .theme-bg { display: none; }
  .theme-sticker .theme-sticker-gif { display: none; }
  .theme-sticker .theme-sticker-poster { display: block; }
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep '^src/' ; echo "exit: ${pipestatus[1]}"`

Expected: no `src/` errors, exit 0.

- [ ] **Step 6: Commit**

Run:
```bash
git add src/components/profile/ProfileThemeBackground.tsx src/app/globals.css
git commit -m "feat: render webtoon background and kayden sticker"
```

---

### Task 4: Wire the theme into ProfileView and the shop preview

**Files:**
- Modify: `src/components/profile/ProfileView.tsx`
- Modify: `src/components/profile/ProfileThemeModal.tsx`

- [ ] **Step 1: ProfileView — sticker card, webtoon classes, and light text**

In `src/components/profile/ProfileView.tsx`, after line 174 (`const themed = ...`):

```tsx
  const isWebtoon = activeTheme.animation?.kind === "webtoon";
  const hasSticker = Boolean(activeTheme.character);
  const heroCardClass = hasSticker
    ? "relative overflow-visible rounded-2xl border border-border p-5 theme-sticker-card"
    : "relative overflow-hidden rounded-2xl border border-border p-5";
  const bioClass = isWebtoon ? "text-zinc-700" : "text-zinc-200";
```

Then make these edits:

1. Header card (line 207-212): replace the `themed ? "..." : "..."` className with:

```tsx
          className={
            themed ? heroCardClass : "rounded-2xl border border-border bg-bg-raised p-5"
          }
```

2. Bio text (line 236): `className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap break-words"` → `className={"mt-2 text-sm whitespace-pre-wrap break-words " + bioClass}`.

3. Root wrapper (line 185): `<div>` → `<div className={isWebtoon ? "profile-theme-webtoon" : undefined}>`.

4. Action row (line 251): `className="relative mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"` → `className={"relative mt-4 flex items-center justify-end gap-2 border-t border-border pt-4" + (isWebtoon ? " webtoon-panel" : "")}`.

5. Posts heading (line 297): `className="mt-6 mb-3 text-sm font-semibold text-muted uppercase tracking-wider"` → `className={"mt-6 mb-3 text-sm font-semibold text-muted uppercase tracking-wider" + (isWebtoon ? " webtoon-section-title" : "")}`.

6. Posts list (line 309): `<div className="space-y-4">` → `<div className={"space-y-4" + (isWebtoon ? " webtoon-posts" : "")}>`.

- [ ] **Step 2: ProfileThemeModal — sticker card in the preview**

In `src/components/profile/ProfileThemeModal.tsx`, replace the preview card className (line 123-127):

```tsx
          <div
            className={
              previewIsDefault
                ? "rounded-2xl border border-border bg-bg-raised p-5"
                : previewTheme?.character
                  ? "relative overflow-visible rounded-2xl border border-border p-5 theme-sticker-card"
                  : "relative overflow-hidden rounded-2xl border border-border p-5"
            }
            style={previewBg}
          >
```

- [ ] **Step 3: Add the webtoon section-treatment CSS**

In `src/app/globals.css`, append after the red-reduced-motion reduced-motion block (end of file):

```css
/* Kayden's Rooftop — section treatments */
.profile-theme-webtoon .webtoon-panel {
  border: 1.5px solid rgba(70, 53, 36, 0.25);
  background: rgba(255, 255, 255, 0.55);
  padding: 10px 12px;
  border-radius: 12px;
}
.profile-theme-webtoon .webtoon-panel span,
.profile-theme-webtoon .webtoon-panel button {
  color: #463524;
}
.profile-theme-webtoon .webtoon-panel .border-border {
  border-color: rgba(70, 53, 36, 0.3);
}
.profile-theme-webtoon .webtoon-posts {
  background: rgba(255, 255, 255, 0.55);
  border: 1.5px solid rgba(70, 53, 36, 0.25);
  border-radius: 16px;
  padding: 14px;
}
.profile-theme-webtoon .webtoon-section-title {
  display: inline-block;
  position: relative;
  margin-left: 10px;
  padding: 4px 14px;
  border-radius: 999px;
  background: #fff;
  border: 1.5px solid #463524;
  color: #463524;
  text-transform: none;
  letter-spacing: normal;
}
.profile-theme-webtoon .webtoon-section-title::after {
  content: "";
  position: absolute;
  left: 12px;
  bottom: -5px;
  width: 8px;
  height: 8px;
  background: #fff;
  border-right: 1.5px solid #463524;
  border-bottom: 1.5px solid #463524;
  transform: rotate(45deg);
}
```

- [ ] **Step 4: Typecheck and build**

Run: `npx tsc --noEmit 2>&1 | grep '^src/' ; echo "exit: ${pipestatus[1]}"` then `npm run build`

Expected: no `src/` errors; build succeeds.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/profile/ProfileView.tsx src/components/profile/ProfileThemeModal.tsx src/app/globals.css
git commit -m "feat: apply webtoon theme to profile sections and shop preview"
```

---

### Task 5: Precache the theme assets

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Bump the cache and add assets**

In `public/sw.js`, change the first two lines:

```js
const CACHE_NAME = "uni-verse-v5";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/apple-touch-icon-180x180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/themes/kayden.gif",
  "/themes/kayden-poster.png",
];
```

- [ ] **Step 2: Sanity-check the file**

Run: `node -e "const s=require('fs').readFileSync('public/sw.js','utf8'); if(!s.includes('uni-verse-v5')||!s.includes('/themes/kayden.gif')) process.exit(1); console.log('sw.js ok')"`

Expected: `sw.js ok`

- [ ] **Step 3: Commit**

Run:
```bash
git add public/sw.js
git commit -m "chore: precache kayden theme assets (uni-verse-v5)"
```

---

### Task 6: Full verification

- [ ] **Step 1: Run the test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep '^src/' ; echo "exit: ${pipestatus[1]}"`

Expected: no `src/` errors, exit 0.

- [ ] **Step 3: ESLint on changed files**

Run: `npx eslint src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts src/components/profile/ProfileThemeBackground.tsx src/components/profile/ProfileView.tsx src/components/profile/ProfileThemeModal.tsx`

Expected: no errors (pre-existing warnings elsewhere are out of scope).

- [ ] **Step 4: Production build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 5: Manual QA on a live build**

Run: `npm run start` (after the build)

1. Shop shows **Kayden's Rooftop** at 300 coins; the 48px swatch shows a small corner sticker (naturally clipped); the preview card shows the animated sticker overlapping the top-right corner.
2. Purchase/apply: with enough coins, buy it, apply it — the profile header shows the animated sticker overlapping the top-right edge, the stats row and Posts list get webtoon panel bands, the "Posts" label becomes a speech bubble, and the rooftop (sun, clouds, halftone, sparkles) renders behind.
3. Name/bio are readable on the light background (bio is `text-zinc-700`); avatar border + name are the dark-brown accent.
4. Post cards keep their dark clean styling (no character, no webtoon scrim).
5. With OS reduce-motion enabled: background hides, the sticker shows the static poster.
6. With DevTools offline after a first visit: profile still shows the sticker and the theme assets load from the service worker cache.

---

## Out of Scope

- No changes to post cards, comments, or shop purchase logic.
- No background-removal of the GIF (white fur must stay).
- Other webtoon characters or additional panels not requested.