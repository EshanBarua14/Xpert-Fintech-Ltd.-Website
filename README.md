# Xpert Fintech Ltd. — Website & Admin CMS

Internal project name: **XPERT NEXUS**. Public brand: **Xpert Fintech Ltd.**

A server-rendered website (English and বাংলা) with an admin portal where Xpert staff edit every page, product, card, image and setting — no hosting or database access needed.

- Architecture and decisions: [XPERT NEXUS — Discovery & Architecture](https://claude.ai/code/artifact/8ea3328b-d0a1-44bb-bd1c-fa312b0d17de)
- Database diagram: [docs/ERD.md](docs/ERD.md)

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS v4 · PostgreSQL 16+ · Prisma 6 · Zod

## Getting started

Requirements: Node.js 20.9+ (22 recommended), PostgreSQL 16+.

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL, SESSION_SECRET, SEED_ADMIN_*
npx prisma validate           # check the schema
npx prisma migrate dev --name init   # create tables (first time)
npm run db:seed               # load Xpert's confirmed content + first admin
npm run dev                   # http://localhost:3000 → redirects to /en
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations in staging/production |
| `npm run db:seed` | Idempotent seed (safe to re-run) |
| `npm run db:studio` | Browse the database |
| `npm run db:erd` | Regenerate `docs/ERD.md` from the schema |

## Project layout

```text
prisma/            schema.prisma, migrations/, seed.ts
scripts/           generate-erd.mjs (ERD + schema sanity checks, no dependencies)
src/
  app/
    [locale]/      public site, server-rendered, /en and /bn
    admin/         admin portal (separate root layout, never indexed)
  components/      ui, layout, navigation, blocks, products, market, diagrams, forms, admin, motion
  content/blocks/  block registry: block type → schema + component
  lib/             db, i18n (auth, storage, seo, search… added per phase)
  middleware.ts    locale routing and the admin login gate
docs/              ERD.md
```

## Admin portal

Sign in at `/admin` with the account created by `npm run db:seed` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

- Five failed passwords lock the account for 15 minutes; 10 attempts per IP per 15 minutes are allowed.
- Sessions end after 12 idle hours (`SESSION_IDLE_HOURS`) or 7 days, or on sign-out.
- Every admin page and server action checks the session in the database; the middleware check is only a fast first gate.

## Content rules

- Content is **Draft** or **Published**, with an optional scheduled publish date. Visitors only see published rows (`src/lib/db/publishing.ts`).
- Deleting moves a record to the trash, where it can be restored or deleted permanently. (Automatic clean-up after 30 days: planned.)
- Every text field is stored per language in a `*Translation` table. A Bangla page appears only once its Bangla text exists.
- One admin role with full rights. Admin login uses Argon2id password hashes and expiring server-side sessions. Two-factor login: planned (the database already supports it). Admins change their password and manage other admins under Admin → Admins.
- Logos of consortium members and clients are shown only when `logoPermission` is on.
- Market data comes from Xpert's licensed feed; demo data can never reach production.

## Phase status

| Phase | Status |
| --- | --- |
| 0 Discovery | Done, except capture of the live site's page text |
| 1 Product architecture | Done: scaffold, schema, ERD, seed |
| 2 Design system | Done: tokens, components, header, footer, order-flow motion |
| 3 Admin portal | Done: login, dashboard, pages & blocks, products, events, people, organizations, deployments, navigation, media, settings, admins |
| 4 Public site | Done: home, CMS pages (16 block types), products, events, board, management, contact, request a demo, localized 404/error, redirects, sitemap, robots, JSON-LD |
| 12 Forms & leads | Planned: demo/contact forms, lead inbox. Until then the contact and demo pages show the email and phone from Admin → Settings |

Secrets live only in `.env` (never committed). See `.env.example` for every variable.
