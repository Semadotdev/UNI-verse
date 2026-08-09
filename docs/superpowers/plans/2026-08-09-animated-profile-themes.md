# Animated Profile Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six premium animated profile themes (Aurora, Stardust, Embers, Ocean Waves, Neon Pulse, Digital Rain) built with pure-CSS animations, plus animated shop swatches.

**Architecture:** `ProfileTheme` gains an optional `animation` config (discriminated union on `kind`). A new `ProfileThemeBackground` client component renders the animated layers using per-kind keyframes in `globals.css`. The base static gradient stays as the fallback; `prefers-reduced-motion: reduce` hides the animated layer entirely. No DB/schema/service/API changes — the server already passes `PROFILE_THEMES` through verbatim.

**Tech Stack:** Next.js (App Router), React client components, Tailwind v4 (CSS variables in `globals.css`), Vitest. No new dependencies.

Design spec: `docs/superpowers/specs/2026-08-09-animated-profile-themes-design.md`

---

### Task 1: Extend the catalog with animated themes (TDD)

**Files:**
- Modify: `src/domain/constants/profile-themes.ts`
- Test: `src/domain/constants/profile-themes.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `src/domain/constants/profile-themes.test.ts`:

```ts
describe("animated theme catalog", () => {
  const ANIMATED_KINDS = ["aurora", "stardust", "embers", "waves", "neon", "matrix"];
  const STATIC_IDS = ["default", "sunset", "ocean", "midnight", "neon"];

  it("marks every animated theme with a valid kind and keeps static themes animation-free", () => {
    for (const t of PROFILE_THEMES) {
      if (t.animation) {
        expect(ANIMATED_KINDS).toContain(t.animation.kind);
      } else {
        expect(STATIC_IDS).toContain(t.id);
      }
    }
  });

  it("prices every animated theme in the premium tier", () => {
    for (const t of PROFILE_THEMES) {
      if (t.animation) expect(t.price).toBeGreaterThanOrEqual(150);
    }
  });

  it("keeps ids unique across the whole catalog", () => {
    const ids = PROFILE_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the default theme free and static", () => {
    const def = getProfileTheme(DEFAULT_THEME_ID);
    expect(def?.price).toBe(0);
    expect(def?.animation).toBeUndefined();
  });

  it("gives every animated theme valid config", () => {
    for (const t of PROFILE_THEMES) {
      const a = t.animation;
      if (!a) continue;
      if (a.kind === "aurora") expect(a.blobs.length).toBeGreaterThan(0);
      if (a.kind === "stardust") expect(a.starCount).toBeGreaterThan(0);
      if (a.kind === "embers") expect(a.emberCount).toBeGreaterThan(0);
      if (a.kind === "waves") expect(a.layers.length).toBeGreaterThan(0);
      if (a.kind === "neon") expect(a.duration).toBeGreaterThan(0);
      if (a.kind === "matrix") expect(a.columnCount).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`
Expected: FAIL — "marks every animated theme with a valid kind..." (new tests fail against the current 5-theme catalog).

- [ ] **Step 3: Extend the type and add the six themes**

In `src/domain/constants/profile-themes.ts`, replace the `ProfileTheme` interface with:

```ts
export type ThemeAnimation =
  | { kind: "aurora"; blobs: { color: string; size: string; duration: number }[] }
  | { kind: "stardust"; starCount: number }
  | { kind: "embers"; emberCount: number }
  | { kind: "waves"; layers: { color: string; duration: number }[] }
  | { kind: "neon"; duration: number }
  | { kind: "matrix"; columnCount: number };

export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: {
    background: [string, string];
    accent: string;
  };
  animation?: ThemeAnimation;
}
```

Append to `PROFILE_THEMES` (after the existing `neon` entry):

```ts
  {
    id: "aurora",
    name: "Aurora",
    description: "Slow drifting ribbons of light.",
    price: 150,
    colors: { background: ["#0a0a14", "#141428"], accent: "#a5b4fc" },
    animation: {
      kind: "aurora",
      blobs: [
        { color: "#7C3AED", size: "70%", duration: 14 },
        { color: "#06b6d4", size: "60%", duration: 18 },
        { color: "#ec4899", size: "50%", duration: 22 },
      ],
    },
  },
  {
    id: "stardust",
    name: "Stardust",
    description: "Twinkling stars in deep space.",
    price: 180,
    colors: { background: ["#0b1026", "#141b3a"], accent: "#c7d2fe" },
    animation: { kind: "stardust", starCount: 26 },
  },
  {
    id: "embers",
    name: "Embers",
    description: "Warm sparks floating upward.",
    price: 200,
    colors: { background: ["#150b1e", "#0a0512"], accent: "#ffb347" },
    animation: { kind: "embers", emberCount: 14 },
  },
  {
    id: "waves",
    name: "Ocean Waves",
    description: "Layered rolling waves at dusk.",
    price: 220,
    colors: { background: ["#062b3f", "#0b3d4f"], accent: "#66e0ff" },
    animation: {
      kind: "waves",
      layers: [
        { color: "rgba(102,224,255,0.35)", duration: 9 },
        { color: "rgba(102,224,255,0.2)", duration: 13 },
      ],
    },
  },
  {
    id: "neonpulse",
    name: "Neon Pulse",
    description: "Shifting gradient with a glowing ring.",
    price: 250,
    colors: { background: ["#120a2f", "#3f1d78"], accent: "#00ffd1" },
    animation: { kind: "neon", duration: 8 },
  },
  {
    id: "digitalrain",
    name: "Digital Rain",
    description: "Falling columns of glyphs.",
    price: 300,
    colors: { background: ["#040a04", "#081408"], accent: "#22c55e" },
    animation: { kind: "matrix", columnCount: 4 },
  },
];
```

Note: `neonpulse` and `digitalrain` ids avoid colliding with the existing static `neon` id.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/constants/profile-themes.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/constants/profile-themes.ts src/domain/constants/profile-themes.test.ts
git commit -m "feat: animated profile theme catalog"
```

---

### Task 2: Add animation keyframes + reduced-motion CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append the animated-theme styles**

Append at the end of `src/app/globals.css`:

```css
/* Animated profile themes */
.theme-bg {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.theme-bg * {
  will-change: transform, opacity;
}

@keyframes theme-aurora-drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(30px, 20px) scale(1.25); }
}
.theme-aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(45px);
  opacity: 0.55;
  mix-blend-mode: screen;
  animation: theme-aurora-drift 14s ease-in-out infinite alternate;
}

@keyframes theme-star-twinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1.2); }
}
.theme-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation: theme-star-twinkle 3s ease-in-out infinite;
}
.theme-star-big { box-shadow: 0 0 8px #fff; }

@keyframes theme-ember-rise {
  0% { transform: translateY(0) scale(0.6); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(-160px) scale(1.1); opacity: 0; }
}
.theme-ember {
  position: absolute;
  bottom: -8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffb347;
  box-shadow: 0 0 10px 2px rgba(255, 150, 60, 0.8);
  opacity: 0;
  animation: theme-ember-rise 6s linear infinite;
}

@keyframes theme-wave-x {
  from { transform: translateX(0); }
  to { transform: translateX(25%); }
}
.theme-wave {
  position: absolute;
  left: -50%;
  bottom: 0;
  width: 200%;
  height: 46px;
  border-radius: 100% 0 0 0 / 100% 0 0 0;
  animation: theme-wave-x 9s linear infinite;
}

@keyframes theme-neon-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.theme-neon {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #120a2f, #3f1d78, #120a2f);
  background-size: 300% 300%;
  animation: theme-neon-shift 8s ease infinite;
}
@keyframes theme-neon-pulse {
  0%, 100% { box-shadow: 0 0 12px rgba(0, 255, 209, 0.2); }
  50% { box-shadow: 0 0 34px rgba(0, 255, 209, 0.55); }
}
.theme-neon-ring {
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(0, 255, 209, 0.35);
  border-radius: 10px;
  animation: theme-neon-pulse 3s ease-in-out infinite;
}

@keyframes theme-matrix-drop {
  from { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  to { transform: translateY(340px); opacity: 0; }
}
.theme-matrix-col {
  position: absolute;
  top: -120px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1;
  color: #22c55e;
  text-shadow: 0 0 6px #22c55e;
  white-space: nowrap;
  writing-mode: vertical-rl;
  animation: theme-matrix-drop 5s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .theme-bg { display: none; }
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `npm run build`
Expected: build succeeds (CSS is processed by Tailwind/Next).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: animated profile theme keyframes with reduced-motion fallback"
```

---

### Task 3: Create `ProfileThemeBackground` component

**Files:**
- Create: `src/components/profile/ProfileThemeBackground.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import type { CSSProperties } from "react";
import type { ProfileTheme, ThemeAnimation } from "@/domain/constants/profile-themes";

interface ProfileThemeBackgroundProps {
  theme: ProfileTheme;
  className?: string;
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const AURORA_POSITIONS = [
  { top: "-20%", left: "-15%" },
  { bottom: "-30%", right: "-20%" },
  { top: "20%", left: "40%" },
] as const;

const MATRIX_GLYPHS = "0123456789カタナザクラ";

function renderLayers(animation: ThemeAnimation, accent: string): React.ReactNode {
  switch (animation.kind) {
    case "aurora":
      return animation.blobs.map((b, i) => {
        const pos = AURORA_POSITIONS[i % AURORA_POSITIONS.length];
        return (
          <div
            key={i}
            className="theme-aurora-blob"
            style={
              {
                background: b.color,
                width: b.size,
                height: b.size,
                ...pos,
                animationDuration: `${b.duration}s`,
              } as CSSProperties
            }
          />
        );
      });

    case "stardust":
      return Array.from({ length: animation.starCount }, (_, i) => {
        const size = 2 + Math.round(hash(i, 3) * 2);
        return (
          <div
            key={i}
            className={"theme-star" + (size >= 3 ? " theme-star-big" : "")}
            style={
              {
                left: `${Math.round(4 + hash(i, 1) * 92)}%`,
                top: `${Math.round(5 + hash(i, 2) * 55)}%`,
                width: size,
                height: size,
                animationDuration: `${(2 + hash(i, 4) * 2).toFixed(2)}s`,
                animationDelay: `${-(hash(i, 5) * 3).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        );
      });

    case "embers":
      return Array.from({ length: animation.emberCount }, (_, i) => (
        <div
          key={i}
          className="theme-ember"
          style={
            {
              left: `${Math.round(4 + hash(i, 1) * 92)}%`,
              animationDuration: `${(4 + hash(i, 2) * 4).toFixed(2)}s`,
              animationDelay: `${-(hash(i, 3) * 6).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ));

    case "waves":
      return animation.layers.map((l, i) => (
        <div
          key={i}
          className="theme-wave"
          style={{ background: l.color, animationDuration: `${l.duration}s` } as CSSProperties}
        />
      ));

    case "neon":
      return (
        <>
          <div
            className="theme-neon"
            style={{ animationDuration: `${animation.duration}s` } as CSSProperties}
          />
          <div
            className="theme-neon-ring"
            style={{ borderColor: accent } as CSSProperties}
          />
        </>
      );

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
  }
}

export function ProfileThemeBackground({ theme, className }: ProfileThemeBackgroundProps) {
  if (!theme.animation) return null;
  return (
    <div aria-hidden className={"theme-bg" + (className ? " " + className : "")}>
      <div className="absolute inset-0 bg-black/25" />
      {renderLayers(theme.animation, theme.colors.accent)}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileThemeBackground.tsx
git commit -m "feat: profile theme animated background component"
```

---

### Task 4: Integrate the background into the profile header

**Files:**
- Modify: `src/components/profile/ProfileView.tsx`

- [ ] **Step 1: Import the component**

Add after the `ProfileThemeModal` import (line 12):

```tsx
import { ProfileThemeBackground } from "@/components/profile/ProfileThemeBackground";
```

- [ ] **Step 2: Add the animated layer to the header card**

Replace the header card opening (currently lines 184-191) with:

```tsx
      <div
        className={
          themed
            ? "relative overflow-hidden rounded-2xl border border-border p-5"
            : "rounded-2xl border border-border bg-bg-raised p-5"
        }
        style={themeBg}
      >
        <ProfileThemeBackground theme={activeTheme} />
```

- [ ] **Step 3: Lift content above the animation**

Give the two rows inside the card `relative`:
- Avatar/content row: `className="flex items-start gap-4"` → `className="relative flex items-start gap-4"` (line 192)
- Buttons row: `className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"` → `className="relative mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"` (line 226)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/ProfileView.tsx
git commit -m "feat: render animated theme background on profile header"
```

---

### Task 5: Animate the shop swatches

**Files:**
- Modify: `src/components/profile/ProfileThemeModal.tsx`

- [ ] **Step 1: Import the component**

Add after the `ApiClient` import (line 6):

```tsx
import { ProfileThemeBackground } from "@/components/profile/ProfileThemeBackground";
```

- [ ] **Step 2: Render the animated layer in each swatch**

Replace the swatch `<div>` (currently lines 126-131) with:

```tsx
                <div
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${t.colors.background[0]}, ${t.colors.background[1]})`,
                  }}
                >
                  <ProfileThemeBackground theme={t} />
                </div>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/ProfileThemeModal.tsx
git commit -m "feat: animate theme swatches in the shop modal"
```

---

### Task 6: Verification

**Files:** None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests including the new animated-catalog tests.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Lint the feature files**

Run: `npx eslint src/domain/constants/profile-themes.ts src/components/profile/ProfileThemeBackground.tsx src/components/profile/ProfileView.tsx src/components/profile/ProfileThemeModal.tsx`
Expected: no errors on feature files (repo-wide lint has pre-existing errors elsewhere).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual QA checklist**

- Own profile → Themes → each animated theme animates in the swatch and applies on the header.
- Visitor profile with an animated theme animates.
- OS "reduce motion" enabled → animated themes render as the static gradient, no movement.
- Text/bio/buttons remain readable on all six animated themes.
- Static themes (Sunset/Ocean/etc.) render unchanged.

- [ ] **Step 6: Commit any remaining work**

```bash
git status --short
git add -A
git commit -m "chore: animated profile themes verification"
```
Only commit if there are uncommitted changes.
