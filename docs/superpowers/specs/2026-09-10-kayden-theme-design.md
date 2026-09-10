# Kayden's Rooftop — Webtoon Profile Theme Design

> **Status:** Approved design
> **Date:** 2026-09-10
> **Supersedes:** `2026-09-10-chibi-prince-theme-design.md` (retired) and its implementation plan `2026-09-10-chibi-prince-theme.md`. Both are removed as part of this feature.

## Purpose

A premium animated profile theme styled like a fantasy/action Korean manhwa character page, centered on the user's orange-and-white tabby **Kayden** in his chibi cat form. The header reads as a sun-soaked rooftop panel in a webtoon; the animated cat sits in a comic-panel "sticker" overlapping the top-right corner of the profile card, and panels/decorations extend to the stats row and Posts section.

## Character asset

- **Source:** `public/Kayden.gif` (1080×1080, 121 frames, ~30 MB, GIF palette, loop 0, ~30 ms/frame, near-white background). Kept untouched in the repo.
- **Optimized derivative** produced once by a script: crop the cat region (frames have a content bbox starting around x=83, y=71), downscale to ~512 px longest side, subsample 121 → ~24 evenly spaced frames, quantize/reduce colors, dispose=2.
  - `public/themes/kayden.gif` — animated sticker (target ≤ 350 KB).
  - `public/themes/kayden-poster.png` — frame 0 as a static PNG (reduced-motion + offline fallback).
- The white background is kept on purpose: chroma-key removal would erase the cat's white fur. The white panel is styled as the sticker surface.

## Theme model changes

In `src/domain/constants/profile-themes.ts`:

- `ThemeAnimation` union gains `"webtoon"`.
- `ProfileTheme` gains optional `character?: { src: string; poster: string }`. `src` is the animated sticker; `poster` is the static fallback.
- New entry:

```ts
{
  id: "kayden",
  name: "Kayden's Rooftop",
  description: "A sun-soaked rooftop in a webtoon, with your favorite orange tabby watching over it.",
  price: 300,
  colors: { background: ["#a9d6ef", "#fbeecf"], accent: "#463524" },
  character: { src: "/themes/kayden.gif", poster: "/themes/kayden-poster.png" },
  animation: "webtoon",
}
```

Color rationale (warm, soft, clean — no neon): `#a9d6ef` bright webtoon sky, `#fbeecf` cream/warm horizon, `#463524` warm dark brown for outlines/text/accents, decorative `#e8b04b` soft gold used only inside the art (sparkles), pink blush comes from the GIF art itself.

## Background rendering (`renderLayers`, new `"webtoon"` branch)

Rendered inside `.theme-bg` exactly like the existing animated themes (absolute inset-0, pointer-events none, overflow hidden, hidden under `prefers-reduced-motion`):

1. Sky gradient + warm horizon glow (uses theme `colors.background`).
2. A soft radial **sun glow** top area + diagonal **light rays** (mix-blend soft-light).
3. 3 blurred white **clouds** (absolute, low opacity, drifting on existing transform-only keyframes).
4. **Halftone overlay** — fine dot grid at low opacity (radial-gradient pattern, `background-size ~14px`).
5. **Faint grain/paper texture** — subtle repeating noise overlay (multiply, ~0.35 opacity).
6. Tiny **sparkle particles** (reuse `theme-star-twinkle`) in soft gold.
7. A couple of **speed-line accents** near the character corner (thin grey diagonal strokes, transform-animated).

Decorations must stay subtle so the sticker remains the focal point.

## Character layer (sticker)

- `ProfileThemeBackground` renders `character` **outside** `.theme-bg` as a sibling absolute element (pointer-events none). This is required so it can over/off-flow the card edge — `.theme-bg` has its own `overflow: hidden` and would clip it.
- Structure: a white rounded comic panel (2.5px `accent` border, soft shadow, small padding) containing the animated `<img src={src}>`; the `<img>` is native-rendered so the GIF loops on its own.
- **Placement (approved — Option C "corner sticker"):** anchored to the top-right of the card, overlapping the corner upward/outward like a stuck-on webtoon sticker.
- The parent card in `ProfileView.tsx` currently is `relative overflow-hidden rounded-2xl`. When the active theme has `character`, it renders as `relative overflow-visible rounded-2xl` (and `.theme-bg` gets `border-radius: inherit` so corners stay rounded). Non-character themes keep `overflow-hidden`.
- **Reduced motion:** `prefers-reduced-motion` swaps the GIF for the poster PNG via pure CSS (two `<img>`s toggled by the media query; `.theme-bg` hides as today). No JS.
- **Shop swatch** (48 px): the sibling renders as a small corner accent via `width: clamp(34px, 30%, 128px)`, anchored same corner; slight natural cropping inside the swatch is acceptable. The shop preview card (~130 px) shows the full sticker.

## Section-level treatment (approved "Header + sections" scope)

A `profile-theme-webtoon` class on the profile wrapper + CSS-only rules in `globals.css`:

- Stats/actions row → thin comic-panel border band (light warm fill).
- Posts section → panel-framed band with a **speech-bubble "Posts"** label (bubble tail via a rotated square).
- 1–2 handwritten-style annotation marks + tiny sparkles as fixed decorative elements near the sections (aria-hidden).
- Post cards themselves stay clean and unchanged.

## Post cards (all themes)

Unchanged. Post cards keep the static gradient + accent-border behavior from the existing posts-theme feature. No character on post cards.

## Service worker

- Add `/themes/kayden.gif` and `/themes/kayden-poster.png` to `STATIC_ASSETS`; bump `CACHE_NAME` `uni-verse-v4` → `uni-verse-v5`.

## Tests

`src/domain/constants/profile-themes.test.ts`:

- `"webtoon"` added to the valid animated kinds covered by the catalog tests.
- New entries block asserting the `kayden` entry: price 300, gradient colors, `character.src` and `character.poster` both start with `/themes/`, and only `kayden` has a `character` field.

## Verification

- `npm test`, `npx tsc --noEmit` (no `src/` errors), eslint on changed files, `npm run build`.
- Manual QA: shop preview shows the animated sticker; purchase/apply flow (coin cost 300); applied profile renders sticker overlapping top-right, sections framed; `prefers-reduced-motion` shows static poster; post cards static gradient; offline reload still shows sticker (precached).

## Housekeeping

- Remove the retired Chibi Prince spec + plan files.
- Generated artifacts (`kayden.gif`, `kayden-poster.png`) live in `public/themes/`; add `public/themes/README.md` noting Kayden is the site owner's character asset.