# User Manual Design

**Date:** 2026-09-15
**Status:** Approved
**Branch:** main

## Summary

Add a user-facing "Help Center" page at `/help` that renders a single Markdown source (`USER-MANUAL.md`) using `react-markdown`. The manual gives users a complete, scannable guide to every feature of UNI-verse. A "Help" link is added to the footer for discoverability.

## Decisions

- **Single Markdown source of truth:** content lives in `USER-MANUAL.md` at repo root. The page renders it; no duplicate content anywhere.
- **Renderer:** `react-markdown` + `remark-gfm` (tables/task lists) + `rehype-slug` (stable heading ids for the in-page TOC). No HTML passthrough needed — `react-markdown` sanitizes by default.
- **Build-time read:** page is `export const dynamic = "force-static"` and reads the file at module scope via `fs.readFileSync` + `process.cwd()`. Works in dev and on Vercel (file inlined at build).
- **Styling:** reuse the existing legal-page container (`container mx-auto px-4 md:px-8 py-8`) with `.prose-dark max-w-3xl`, matching `/legal/*` pages.
- **Discovery:** footer link `{ href: "/help", label: "Help" }` in `src/components/layout/Footer.tsx`. No navbar change.
- **Metadata:** `title: "Help Center | UNI-verse"`.

## Manual Structure

1. **Getting Started** — create an account, sign in, install the PWA (offline reading).
2. **Finding & Reading** — search across providers, provider switcher, manga detail page, add to library.
3. **The Reader** — chapter/page navigation (swipe/arrows), reader settings, reading history auto-save, page comments (long-press to pin, reply, delete, report), retry on failed pages.
4. **Library & History** — add to library, folders, shareable public links, continue-where-you-left-off.
5. **Community** — posts, comments & reactions, image lightbox, NSFW tags, reporting/moderation.
6. **Friends & Profiles** — add friends by username, customize bio/avatar.
7. **Rewards** — coins for completing chapters, theme shop (incl. animated themes), leaderboard.
8. **Notifications** — Activity (real-time), What's New.
9. **Troubleshooting & FAQ** — chapter 404 / page load failures, missing awards, how reports are handled.

Each section is a few short paragraphs + bullet lists. A TOC of anchor links sits at the top (works in-app and on GitHub).

## Files

| File | Change |
| --- | --- |
| `package.json` | add `react-markdown`, `remark-gfm`, `rehype-slug` |
| `USER-MANUAL.md` | new — manual content |
| `src/app/help/page.tsx` | new — server component rendering the manual |
| `src/components/layout/Footer.tsx` | add Help link |

## Verification

- `npx tsc --noEmit` exits 0.
- `npx eslint "src/app/help/page.tsx" "src/components/layout/Footer.tsx"` 0 errors.
- Manual smoke: `/help` renders Markdown (headings, lists, TOC anchors); footer Help link navigates correctly.
- No DB/schema changes; existing test suite unaffected.

## Out of Scope

- README/developer-doc changes.
- Navbar or mobile-menu help link.
- Localization.