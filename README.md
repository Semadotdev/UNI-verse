<p align="center">
  <img src="public/Universe-logo.png" alt="UNI-verse" width="120" />
</p>

<h1 align="center">UNI-verse</h1>

<p align="center">
  Grace Lights the Way to Every Story.
</p>

<p align="center">
  A fast, installable manga &amp; manhwa reader for the web.
</p>

## Features

- **Multi-source reading** — browse and read from a growing list of providers (MangaDex, Asura Scans, Webtoons, Manhwa18, and more)
- **Search** — find any series across sources with debounced, async search
- **Library** — save favorites and organize them into folders, shareable via public links
- **Reading history** — automatically tracks where you left off
- **Mobile-first reader** — swipe left/right to navigate chapters and pages
- **Installable PWA** — works offline-ready, installable on any device
- **Accounts** — email registration and sign-in via Supabase Auth
- **Dark-themed, responsive UI** — clean design on mobile and desktop

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Prisma](https://www.prisma.io) + PostgreSQL
- [Supabase](https://supabase.com) Auth
- PWA (manifest + service worker)

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- A PostgreSQL database and a Supabase project

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then fill in your database + Supabase credentials

# 3. Push the database schema
npm run db:push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler) |
| `DIRECT_URL` | Direct PostgreSQL connection string (migrations/backups) |
| `SHADOW_DATABASE_URL` | Separate throwaway DB for `migrate dev` validation (optional) |
| `ALLOW_DESTRUCTIVE_MIGRATIONS` | Set to `true` to bypass the destructive-command guard (don't) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL exposed to the client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key exposed to the client |

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check the codebase |
| `npm run db:migrate` | Apply pending migrations with `prisma migrate deploy` (safe — never resets) |
| `npm run db:migrate:create` | Create a new migration without applying it (guarded) |
| `npm run db:push` | Push schema changes (guarded against `--accept-data-loss`) |
| `npm run db:reset` | Reset the DB — **blocked** against the shared Supabase DB |
| `npm run db:backup` | Local `pg_dump` backup into `backups/` (requires `pg_dump`) |
| `npm run db:studio` | Open Prisma Studio |

## Database safety

> **This DB was wiped once already by `prisma migrate dev` running `DROP SCHEMA "public" CASCADE`**
> (no migration history existed because the schema was created with `db push`, so Prisma offered a reset).
> The guard scripts exist to stop that from ever happening again.

- Destructive commands (`migrate dev`, `migrate reset`, `db push --accept-data-loss`) are **blocked** by `scripts/db-guard.mjs` when targeting the shared Supabase DB, unless `ALLOW_DESTRUCTIVE_MIGRATIONS=true` is set.
- **Apply** schema changes with `npm run db:migrate` (`prisma migrate deploy`), which only runs pending migrations and never drops data.
- **Create** new migrations with `npm run db:migrate:create` (`migrate dev --create-only`). It validates against `SHADOW_DATABASE_URL` — point that at a local/throwaway Postgres, never the shared DB.
- **Backups**: `npm run db:backup` for an on-demand `pg_dump`; a scheduled GitHub Action (`.github/workflows/db-backup.yml`) runs daily at 03:17 UTC and stores the last 14 dumps in the `db-backups` Supabase Storage bucket. Add `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` as repo secrets and create the bucket once.

## Deployment

The app is ready for [Vercel](https://vercel.com). Connect the repository and add the environment variables from [.env.example](.env.example) in your project settings. Ensure the PostgreSQL database is reachable from the deployment region.

### Post images storage

The posts feed stores uploaded images in a Supabase Storage bucket named `post-images`. Create the bucket once and make it public-read (it is server-uploaded via the service role key). Image validation (type, 5 MB limit) is enforced server-side.

## Legal

UNI-verse does not host any content. It aggregates publicly available content from third-party sources. Content rights belong to their respective owners. See the `/dmca` and `/legal` pages in-app for details.
