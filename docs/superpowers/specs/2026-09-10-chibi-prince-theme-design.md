# Chibi Prince Character Theme — Design Spec

**Date:** 2026-09-10
**Status:** Approved

## Problem

The profile theme shop offers gradient and animated themes, but no character/mascot theming. The user wants a theme featuring a chibi manhwa-style character sourced from the internet, animated in-app.

## Decisions (from brainstorming)

1. **Asset source** — `WIP-chibi-manhwa-prince.png` by **abionic** ("Chibi Manhwa Characters" pack on itch.io), **MIT license** (free for personal and commercial use, crediting optional). Downloaded via the pack's name-your-own-price purchase flow at $0. No generative AI used by the artist.
2. **Integration approach** — a new optional `character?: { src: string }` field on `ProfileTheme`, rendered by `ProfileThemeBackground` (Approach 1). A single theme entry: `chibi-prince` at **price 280** (between Neon Pulse 250 and Digital Rain 300).
3. **"Animated" means CSS-driven** — one idle frame cropped from the sprite sheet; the app animates it with a bob/sway keyframe + gold sparkle accents. No multi-frame idle cycling (the pack provides IDLE/RUN/ATTACK poses, not multiple idle frames).
4. **Appearance scope** — profile header + shop swatches render the character (same as existing animated themes). Post cards keep the static gradient only (no character), consistent with the profile-theme-on-posts decision.
5. **Reduced motion** — `prefers-reduced-motion` hides the character layer (`theme-bg` rule unchanged); the static base gradient remains.
6. **Attribution** — MIT makes credit optional, but a credit note is kept in the repo.
7. **No DB/schema/API changes** — `PROFILE_THEMES` already flows verbatim to clients; purchase/apply logic is data-driven.

## Architecture

### Asset

- Download `WIP-chibi-manhwa-prince.png` (49 kB) from the pack's purchase page.
- Inspect the sprite sheet: frame layout, dimensions, transparency.
- Crop one idle frame and save as `public/themes/chibi-prince.png` (transparent PNG, target < 100 kB).
- Palette: choose `colors.background` / `colors.accent` to complement the sprite's dominant colors after inspecting the art (implementation step; the gradient is the reduced-motion/static fallback).
- Credit note file `public/themes/README.md` recording: `"Chibi Prince" character by abionic (itch.io) — MIT license, https://abionic.itch.io/chibi-manhwa-characters`.

### Data model — `src/domain/constants/profile-themes.ts`

`ProfileTheme` gains an optional field:

```ts
export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: { background: [string, string]; accent: string };
  character?: { src: string }; // NEW
  animation?: ThemeAnimation;  // unchanged
}
```

New entry appended to `PROFILE_THEMES`:

```ts
{
  id: "chibi-prince",
  name: "Chibi Prince",
  description: "A royal little guy watching over your profile.",
  price: 280,
  colors: { background: ["<hex1>", "<hex2>"], accent: "#ffd166" }, // tuned to the art
  character: { src: "/themes/chibi-prince.png" },
}
```

The entry has `character` and no `animation` (sparkles are rendered by the character layer). `getProfileTheme` / `resolveProfileTheme` / `isDefaultTheme` unchanged. No DB/service/API changes — the server already returns `PROFILE_THEMES` verbatim, so the new theme and asset URL reach clients automatically.

### Rendering — `src/components/profile/ProfileThemeBackground.tsx`

- If `theme.character` is set, render a character layer inside `.theme-bg` alongside the existing scrim:
  - `<div className="theme-chibi">` positioned in the **bottom-left** corner (absolute, `pointer-events-none`).
  - `<img src={theme.character.src} alt="" draggable={false} />` (character already has `aria-hidden` from `.theme-bg`).
  - 3–5 sparkle spans (`✦`) at **deterministic** positions with staggered `animation-delay` (same index-hash pattern as stardust — no `Math.random`, no hydration mismatch).
- Placed before/after `renderLayers(...)` output; must not break existing animated themes (character is independent of `animation.kind`).
- `prefers-reduced-motion` already hides `.theme-bg` — unchanged.

### Keyframes — `src/app/globals.css`

- `@keyframes theme-chibi-bob` — translateY + slight rotate, `ease-in-out infinite`, animating **only transform** (compositor-friendly, consistent with the existing `.theme-*` keyframes).
- `.theme-chibi` — `position: absolute`, fixed width (img height responsive), drop-shadow for cohesion with the art.
- `.theme-chibi-spark` — gold `✦` text spans using the existing `theme-star-twinkle` keyframes (opacity/scale twinkle), text-shadow glow.

### Integration

- **`ProfileView.tsx`** already renders `<ProfileThemeBackground theme={activeTheme} />` — picks up automatically (no change expected; verify).
- **`ProfileThemeModal.tsx`** swatches render `<ProfileThemeBackground theme={t} />` — the 48px swatch shows the character automatically (no change expected; verify layout at small size, character sized to fit).
- **`PostCard.tsx`** — unchanged. Character themes render as static gradient + accent on posts (existing behavior), no character image.
- **`public/sw.js`** — add `/themes/chibi-prince.png` to `STATIC_ASSETS` so the profile renders offline. Coordinate with the in-flight, uncommitted iOS-apple-touch-icon changes (`sw.js` STATIC_ASSETS + cache version): land both together with a single cache-version bump (`uni-verse-v4` → `uni-verse-v5`).

### Attribution

- `public/themes/README.md` credit note (above). No license file reproduction required under MIT, but the note is retained in-repo.

## Testing

- `profile-themes.test.ts` gains a "character theme" describe block (extends the animated-theme catalog pattern):
  - `chibi-prince` has a non-empty `character.src` starting with `/themes/`.
  - Unique id, `price: 280`, non-default, owned-flow unaffected (free themes stay free, default stays static).
  - Existing themes are unaffected: `character` undefined for all others; static themes have no `animation`.
- Component has no test infra (no testing-library); verified via typecheck + build + manual QA.
- Manual QA checklist: profile header shows the character (bottom-left) bobbing with sparkles; shop swatch previews it; reduced-motion shows static gradient; post cards static; purchase → apply flow works (coins deducted, owned, applied); offline (SW) serves the character.

## Verification commands

- `npm test` (vitest)
- `npm run typecheck`
- eslint on changed files
- `npm run build`

## Out of scope

- No schema/migration/service/API changes.
- No new dependencies.
- No multi-frame idle cycling, RUN/ATTACK poses, or additional characters.
- Character not rendered on post cards or comments.
- Theme asset not precached beyond profile context.