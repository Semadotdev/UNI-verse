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
| `DIRECT_URL` | Direct PostgreSQL connection string (migrations) |
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
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:migrate` | Create and run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

The app is ready for [Vercel](https://vercel.com). Connect the repository and add the environment variables from [.env.example](.env.example) in your project settings. Ensure the PostgreSQL database is reachable from the deployment region.

## Legal

UNI-verse does not host any content. It aggregates publicly available content from third-party sources. Content rights belong to their respective owners. See the `/dmca` and `/legal` pages in-app for details.
