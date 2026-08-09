# Animated Profile Themes — Design Spec

**Date:** 2026-08-09
**Status:** Approved

## Problem

The profile themes shop currently offers five static gradient themes (max price 100). Users want premium themes that animate.

## Decisions (from brainstorming)

1. **Six new animated themes** — Aurora, Stardust, Embers, Ocean Waves, Neon Pulse, Digital Rain.
2. **Prices** — Aurora 150, Stardust 180, Embers 200, Ocean Waves 220, Neon Pulse 250, Digital Rain 300. Existing static themes unchanged.
3. **Animated shop swatches** — the 48px swatches in the shop modal play the same animation as the applied theme.
4. **Respect reduced motion** — `@media (prefers-reduced-motion: reduce)` hides the animated layer; the static base gradient remains.
5. **Pure CSS approach** — layered `<div>`s + keyframes in `globals.css`, no new dependencies, compositor-friendly (transform/opacity only), deterministic placement to avoid hydration mismatch.

## Architecture

### Data model

`src/domain/constants/profile-themes.ts`:

- `ProfileTheme` gains an optional `animation?: ThemeAnimation` field. The existing `colors` remain the static fallback gradient + accent.
- `ThemeAnimation` is a discriminated union on `kind`:

```ts
export type ThemeAnimation =
  | { kind: "aurora"; blobs: { color: string; size: string; duration: number }[] }
  | { kind: "stardust"; starCount: number }
  | { kind: "embers"; emberCount: number }
  | { kind: "waves"; layers: { color: string; duration: number }[] }
  | { kind: "neon"; duration: number }
  | { kind: "matrix"; columnCount: number };
```

- Six new entries appended to `PROFILE_THEMES`. Ids: `aurora`, `stardust`, `embers`, `waves`, `neonpulse`, `digitalrain` (the latter two avoid colliding with the existing static `neon` id).
- `getProfileTheme` / `resolveProfileTheme` / `isDefaultTheme` unchanged.
- **No DB/schema/service/API changes.** The server already returns `PROFILE_THEMES` verbatim, so animation config reaches clients automatically. `PurchasedTheme` rows are unchanged.

### Rendering

New client component `src/components/profile/ProfileThemeBackground.tsx`:

- Props: `{ theme: ProfileTheme; className?: string }`. Returns `null` when `theme.animation` is undefined (backward compatible with static themes).
- Renders `<div class="theme-bg">` (absolute inset-0, overflow-hidden, pointer-events-none) containing:
  - a readability scrim `<div class="absolute inset-0 bg-black/25">`,
  - per-kind layers selected via `switch (animation.kind)`.
- **Deterministic placement:** star/ember/matrix element positions derive from an index-based hash `Math.sin(i * 127.1 + salt * 311.7) * 43758.5453` (fractional part), so server-rendered HTML is identical to client — no hydration mismatch.
- Per-theme params (colors, durations, sizes) applied via inline styles; keyframes are shared per kind in `globals.css`.

### Keyframes (`globals.css`)

One `@keyframes` block per kind (`theme-aurora-drift`, `theme-star-twinkle`, `theme-ember-rise`, `theme-wave-x`, `theme-neon-shift`, `theme-neon-pulse`, `theme-matrix-drop`), animating **only transform/opacity** (aurora adds `filter: blur()` + `will-change` on 3 small blobs). Layer classes prefixed `.theme-`.

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .theme-bg { display: none; }
}
```

### Integration

- **`ProfileView.tsx`:** themed header card gains `relative overflow-hidden`; `<ProfileThemeBackground theme={activeTheme} />` is the first child; the avatar/content row and buttons row gain `relative` so they stack above the animated layer. Existing `themeBg`/`themeAccent`/`themeText`/`themeOutline` logic untouched.
- **`ProfileThemeModal.tsx`:** each 48px swatch becomes `relative overflow-hidden` and renders `<ProfileThemeBackground theme={t} />` above its static gradient.

## Testing

- `profile-themes.test.ts` gains an "animated theme catalog" describe block: valid kind per animated theme, static themes animation-free, premium-tier pricing, unique ids, default theme free/static, per-kind config validity.
- No component test infra exists (no testing-library in deps); component is verified via typecheck + build + manual QA.
- Verification: `npm test`, `npm run typecheck`, eslint on feature files, `npm run build`, manual QA (each theme animates, reduced-motion freezes, swatches animate, text readable, static themes unchanged).

## Out of scope

- No schema/migration/service/API changes.
- No new dependencies.
- No changes to reader, history, coins, or the coin-farming known limitation.
- Animated themes appear only on the profile header and shop swatches.
