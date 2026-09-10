# Chibi Prince Character Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Chibi Prince" profile theme featuring a MIT-licensed chibi manhwa character (by abionic) that renders in the profile header and shop swatches with a CSS bob animation + gold sparkles.

**Architecture:** `ProfileTheme` gains an optional `character?: { src: string }` field pointing at a cropped transparent PNG served from `/public/themes/`. `ProfileThemeBackground` renders the character layer inside `.theme-bg` (the existing animated-theme container), so `ProfileView` and `ProfileThemeModal` swatches/previews pick it up with zero changes. `sw.js` precaches the asset. No DB/API/schema changes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Vitest, PIL (Python image processing), vanilla CSS keyframes.

**Spec:** `docs/superpowers/specs/2026-09-10-chibi-prince-theme-design.md`

---

### Task 1: Acquire, segment, and crop the character asset

**Files:**
- Create: `public/themes/chibi-prince.png` (processed asset)
- Create: `public/themes/README.md` (credit note)

- [ ] **Step 1: Get the source file**

The itch.io pack download requires a browser session (name-your-own-price checkout). Ask the user to download it now:

> Please download `WIP-chibi-manhwa-prince.png` from https://abionic.itch.io/chibi-manhwa-characters (choose and confirm "Download", price $0) and tell me where the file landed (usually `~/Downloads/WIP-chibi-manhwa-prince.png`).

Wait for confirmation, then stage it:

Run:
```bash
mkdir -p /tmp/uni-verse-chibi public/themes
cp ~/Downloads/WIP-chibi-manhwa-prince.png /tmp/uni-verse-chibi/sheet.png
python3 -c "from PIL import Image; im=Image.open('/tmp/uni-verse-chibi/sheet.png'); print('size:', im.size, '| mode:', im.mode)"
```
Expected: the sheet's pixel dimensions and an RGBA/LA/P mode (transparency required). If the file fails to open, ask the user for the correct path.

- [ ] **Step 2: Write the segment/crop script**

**Write** `/tmp/uni-verse-chibi/process.py`:

```python
import os
from collections import Counter
from PIL import Image

SRC = "/tmp/uni-verse-chibi/sheet.png"
OUT = "/home/jiromanalo/Projects/UNI-verse/public/themes/chibi-prince.png"
CELL_IDX = 0  # 0 = first cell (expected idle frame); adjust if output looks wrong

im = Image.open(SRC).convert("RGBA")
alpha = im.getchannel("A")
w, h = im.size

opacity = []
for x in range(w):
    opacity.append(sum(1 for y in range(h) if alpha.getpixel((x, y)) > 40))

cells = []
start = None
for x in range(w):
    if opacity[x] > 0 and start is None:
        start = x
    elif opacity[x] == 0 and start is not None:
        cells.append((start, x))
        start = None
if start is not None:
    cells.append((start, w))

if not cells:
    cells = [(0, w)]
print("cells (x ranges):", cells)
if CELL_IDX >= len(cells):
    raise SystemExit(f"CELL_IDX {CELL_IDX} out of range; cells: {cells}")

x0, x1 = cells[CELL_IDX]
cell = im.crop((x0, 0, x1, h))
inner = cell.getchannel("A").getbbox() or (0, 0, cell.width, cell.height)
print("cell size:", cell.size, "| inner bbox:", inner)

out = cell.crop(inner)
out.save(OUT, "PNG", optimize=True)

counts = Counter(p[:3] for p in out.getdata() if p[3] > 40)
print("dominant opaque colors:")
for color, n in counts.most_common(8):
    print("  #%02x%02x%02x  x%d" % (color[0], color[1], color[2], n))
print("saved:", OUT, "|", out.size, "|", os.path.getsize(OUT), "bytes")
```

- [ ] **Step 3: Run the script**

Run: `python3 /tmp/uni-verse-chibi/process.py`

Expected: a printed cell list, the cropped output size, and 8 dominant opaque hex colors (e.g. golden/white/prince-themed tones). The saved file must be < 100 000 bytes. If the output is a wide multi-character strip (cells > its inner bbox suggests the segment grabbed several poses), re-run with `CELL_IDX` set to the correct cell.

- [ ] **Step 4: Record the palette decision**

From the printed dominant colors:
- If the top colored tones (non-white/black) are clearly saturated and distinct, set:
  - `background[0]` = darkest dominant color's hex, `background[1]` = second dominant color's hex, `accent` = brightest dominant color's hex.
- Otherwise (neutral/white-heavy art), use the fallback royal palette: background `["#1c1033", "#4c2a6e"]`, accent `#ffd166`.

Note the chosen hexes — Task 2 uses them.

- [ ] **Step 5: Write the credit note**

**Write** `public/themes/README.md`:

```markdown
# Theme assets

## Chibi Prince

Character: "Chibi Prince" by abionic — "Chibi Manhwa Characters" pack (itch.io).
License: MIT (free for personal and commercial use; crediting optional).
Source: https://abionic.itch.io/chibi-manhwa-characters

`chibi-prince.png` is one idle frame cropped from `WIP-chibi-manhwa-prince.png`.
```

- [ ] **Step 6: Commit**

Run:
```bash
git add public/themes/chibi-prince.png public/themes/README.md
git commit -m "chore: add chibi prince theme asset"
```

---

### Task 2: Add `character` field and the theme entry (TDD)

**Files:**
- Modify: `src/domain/constants/profile-themes.ts` (interface + `PROFILE_THEMES` entry)
- Test: `src/domain/constants/profile-themes.test.ts`

- [ ] **Step 1: Update tests (expected to fail)**

In `src/domain/constants/profile-themes.test.ts`:
1. Change `STATIC_IDS` (in the "animated theme catalog" describe) to include the new id:

```ts
const STATIC_IDS = ["default", "sunset", "ocean", "midnight", "neon", "chibi-prince"];
```

2. Append a new describe block after the "animated theme catalog" block:

```ts
describe("character theme catalog", () => {
  it("includes a theme with a character asset", () => {
    const theme = getProfileTheme("chibi-prince");
    expect(theme?.character?.src.startsWith("/themes/")).toBe(true);
  });

  it("prices the character theme in the premium tier", () => {
    expect(getProfileTheme("chibi-prince")?.price).toBe(280);
  });

  it("only marks chibi-prince as a character theme", () => {
    for (const t of PROFILE_THEMES) {
      if (t.id === "chibi-prince") continue;
      expect(t.character).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`

Expected: FAIL — `getProfileTheme("chibi-prince")` returns `undefined`.

- [ ] **Step 3: Add the `character` field and theme entry**

In `src/domain/constants/profile-themes.ts`:

```ts
export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    background: [string, string];
    accent: string;
  };
  character?: { src: string };
  animation?: ThemeAnimation;
}
```

Append to the end of the `PROFILE_THEMES` array (after the `digitalrain` entry), using the hexes recorded in Task 1 Step 4 (fallback shown):

```ts
  {
    id: "chibi-prince",
    name: "Chibi Prince",
    description: "A royal little guy watching over your profile.",
    price: 280,
    colors: { background: ["#1c1033", "#4c2a6e"], accent: "#ffd166" },
    character: { src: "/themes/chibi-prince.png" },
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`

Expected: PASS (all "profile-themes catalog", "animated theme catalog", and "character theme catalog" tests).

- [ ] **Step 5: Commit**

Run:
```bash
git add src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts
git commit -m "feat: add chibi prince character theme"
```

---

### Task 3: Render the character layer in ProfileThemeBackground + keyframes

**Files:**
- Modify: `src/components/profile/ProfileThemeBackground.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update the component guard and add the character layer**

In `src/components/profile/ProfileThemeBackground.tsx`:

1. Change the early-return so character-only themes (`animation` undefined) still render:

```tsx
export function ProfileThemeBackground({ theme, className }: ProfileThemeBackgroundProps) {
  if (!theme.animation && !theme.character) return null;
```

2. Add a deterministic sparkle table above the component (after `MATRIX_GLYPHS`):

```tsx
const CHARACTER_SPARKLES = [
  { left: "8%", top: "18%", delay: -0.3, duration: 2.2 },
  { left: "22%", top: "42%", delay: -1.4, duration: 2.8 },
  { left: "5%", top: "66%", delay: -2.1, duration: 2.4 },
] as const;
```

3. Render the character layer after the animation layers, guarding `renderLayers` for character-only themes (`theme.animation` may be undefined — the switch reads `animation.kind`):

```tsx
  return (
    <div aria-hidden className={"theme-bg" + (className ? " " + className : "")}>
      <div className="absolute inset-0 bg-black/25" />
      {theme.animation && renderLayers(theme.animation, theme.colors.accent)}
      {theme.character && (
        <div className="theme-chibi">
          <img src={theme.character.src} alt="" draggable={false} />
          {CHARACTER_SPARKLES.map((sp, i) => (
            <span
              key={i}
              className="theme-chibi-spark"
              style={
                {
                  left: sp.left,
                  top: sp.top,
                  color: theme.colors.accent,
                  animationDelay: `${sp.delay}s`,
                  animationDuration: `${sp.duration}s`,
                } as CSSProperties
              }
            >
              ✦
            </span>
          ))}
        </div>
      )}
    </div>
  );
```

- [ ] **Step 2: Add the keyframes and layer styles**

In `src/app/globals.css`, insert after the `.theme-matrix-col` block (line ~567) and before the reduced-motion block:

```css
@keyframes theme-chibi-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}
.theme-chibi {
  position: absolute;
  left: 6%;
  bottom: 2%;
  width: 34%;
  min-width: 34px;
  max-width: 118px;
  animation: theme-chibi-bob 4s ease-in-out infinite;
}
.theme-chibi img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35));
}
.theme-chibi-spark {
  position: absolute;
  font-size: 12px;
  line-height: 1;
  opacity: 0.6;
  text-shadow: 0 0 6px currentColor;
  animation: theme-star-twinkle 2.5s ease-in-out infinite;
}
```

The sparks reuse the existing `theme-star-twinkle` keyframes; `prefers-reduced-motion` already hides `.theme-bg`, which covers the character.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep '^src/' ; echo "exit: ${pipestatus[1]}"`

Expected: no `src/` errors.

- [ ] **Step 4: Manual QA (no coins needed — use the shop preview)**

Run: `npm run dev`

1. Open any profile page → click the Themes button → the shop list shows a **Chibi Prince** row. Its 48px swatch (bottom-left) shows the character at small scale.
2. Tap the preview eye icon → the preview card renders the character bobbing (bottom-left) with 3 gold ✦ sparks.
3. Rotate through existing animated themes (Aurora etc.) in the preview — unchanged.
4. Confirm the page has no console errors.

Stop the dev server.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/profile/ProfileThemeBackground.tsx src/app/globals.css
git commit -m "feat: render chibi character layer in profile theme backgrounds"
```

---

### Task 4: Precache the theme asset in the service worker

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Add the asset + bump the cache version**

In `public/sw.js`, change the two block-scoped constants:

```js
const CACHE_NAME = "uni-verse-v5";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/apple-touch-icon-180x180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/themes/chibi-prince.png",
];
```

- [ ] **Step 2: Sanity-check the file**

Run: `node -e "const s=require('fs').readFileSync('public/sw.js','utf8'); if(!s.includes('uni-verse-v5')||!s.includes('/themes/chibi-prince.png')) process.exit(1); console.log('sw.js ok')"`

Expected: `sw.js ok`

- [ ] **Step 3: Commit**

Run:
```bash
git add public/sw.js
git commit -m "chore: precache chibi prince theme asset (uni-verse-v5)"
```

---

### Task 5: Full verification

- [ ] **Step 1: Run the test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep '^src/' ; echo "exit: ${pipestatus[1]}"`

Expected: no `src/` errors, exit 0.

- [ ] **Step 3: ESLint on changed files**

Run: `npx eslint src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts src/components/profile/ProfileThemeBackground.tsx`

Expected: no errors (pre-existing warnings elsewhere are out of scope).

- [ ] **Step 4: Production build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 5: Final manual QA on a live build**

Run: `npm run start` (after build)

1. Purchase flow works: with enough coins, Chibi Prince (280) can be purchased, becomes owned, and applies.
2. Applied on a profile: header shows the character bobbing with sparks; static gradient + accent fall back correctly in `prefers-reduced-motion` (OS-level reduce motion enabled).
3. Post cards keep the static gradient only (no character image).
4. With DevTools offline: the profile page still shows the character (precached by the SW after a first visit).

---

## Out of Scope

- No multi-frame cycling, RUN/ATTACK poses, or additional characters.
- No DB/schema/API changes; no new dependencies.
- Character not rendered on post cards or comments.