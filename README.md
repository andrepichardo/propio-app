# Propio

> **Manage your properties with confidence.**

Propio is a modern property management platform for independent landlords (1–50 properties). One calm, fast dashboard for properties, tenants, contracts, payments, receipts, expenses, documents and reports.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) · React 19 · TypeScript (strict) |
| Styling | Tailwind CSS · shadcn/ui · Lucide · Framer Motion |
| Forms & validation | React Hook Form · Zod (everywhere) |
| Data | Prisma · PostgreSQL |
| Auth | Auth.js v5 (Credentials + Google + GitHub), JWT sessions |
| State | Server Components first · TanStack Query for client caches |
| Storage | Supabase Storage behind a swappable `StorageService` interface |
| Email | Resend |
| PDF | @react-pdf/renderer (receipts & monthly statements) |
| Charts | Recharts |
| Tables | TanStack Table |
| Dates | date-fns · Toasts: Sonner |

## Getting started

### 1. Prerequisites

- Node.js ≥ 20
- PostgreSQL (local or hosted — Neon/Supabase/RDS all work)

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env
```

Fill in at minimum:

- `DATABASE_URL` (and `DIRECT_URL` if you use a pooler)
- `AUTH_SECRET` — generate with `openssl rand -base64 32`

Optional but recommended:

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth
- `RESEND_API_KEY` — transactional email (welcome, password reset, receipts)
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — file storage (property photos, documents, receipt PDFs)

The app degrades gracefully: without Resend it logs emails instead of sending; without Supabase, uploads fail with a clear error while everything else works.

### 4. Database

```bash
npm run db:push      # create the schema (dev)
npm run db:seed      # optional: demo data → demo@propio.app / Demo1234!
```

For production use migrations instead: `npm run db:migrate`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 — register an account or sign in with the seeded demo user.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run lint` / `format` / `typecheck` / `test` | Quality gates (Vitest unit tests) |
| `npm run db:push` / `db:migrate` / `db:studio` / `db:seed` | Database workflows |

## Architecture

Feature-based, with strict layering inside each feature:

```
src/
├── app/                    # Routes only — thin, delegate to features
│   ├── (auth)/             # login, register, forgot/reset password
│   ├── app/                # protected dashboard (middleware + layout guard)
│   └── api/auth/           # Auth.js handler
├── features/<feature>/
│   ├── validators/         # Zod schemas — single source of input truth
│   ├── repositories/       # Prisma access, ALWAYS owner-scoped
│   ├── services/           # business logic, transactions, activity log
│   ├── actions/            # server actions ('use server'), thin wrappers
│   └── components/         # feature UI (server + client components)
├── shared/
│   ├── components/         # design system (ui/) + composites
│   ├── hooks/              # client hooks (server-action helpers)
│   ├── lib/                # prisma, auth, storage, errors, result, action
│   ├── config/             # zod-validated env
│   └── types/              # pagination, shared types
├── emails/                 # Resend client + HTML templates
├── pdf/                    # react-pdf documents + render helpers
└── middleware.ts           # edge route protection
```

### Key patterns

- **Multi-tenancy** — every domain row carries `ownerId`. Repositories put it in *every* `where` clause; `requireOwnerId()` derives it from the session. Cross-entity links (contract → property/tenant) verify ownership before writing.
- **Server actions** — built with `createOwnerAction(schema, handler)` which handles auth + Zod validation + error mapping, returning a typed `ActionResult<T>` the client pattern-matches (no try/catch in components).
- **Payments flow** — registering a payment atomically (one transaction) creates the payment, issues a sequential receipt (`REC-2026-0001`), and logs activity. PDF rendering, storage upload and the optional tenant email run post-commit so slow I/O never rolls back money.
- **Soft deletes** — `deletedAt` on domain models; reads exclude them, history is preserved.
- **Storage abstraction** — features depend on the `StorageService` interface; the Supabase driver is one file. Swapping to S3/R2 touches only `shared/lib/storage`.
- **URL-driven lists** — search/filter/pagination live in the query string; server components re-fetch, results are shareable, the back button works.
- **Route resilience** — every section has `loading.tsx` (skeletons) and `error.tsx` (friendly recovery), with data streamed through `<Suspense>`.

## Features

- ✅ Auth: email+password, Google, GitHub, forgot/reset password, **email verification** (link + in-app banner with resend), protected routes
- ✅ Dashboard: KPI cards, revenue vs expenses chart, upcoming payments, expiring contracts, recent activity, quick actions
- ✅ Properties: CRUD, types, statuses, **photo gallery uploads** (first photo becomes cover), filters + search
- ✅ Tenants: CRUD, emergency contacts, notes, **avatar upload**
- ✅ Contracts: CRUD, terms, due day, deposit, auto-occupancy, **signed PDF attachment**
- ✅ Payments: register → auto receipt (PDF) → balances → dashboard, optional email to tenant
- ✅ Receipts: sequential numbering per owner, downloadable PDFs
- ✅ Monthly statements: **generate per contract/month** — payment history, outstanding balance, next due date, PDF
- ✅ Expenses: full CRUD (create/edit/delete) with categories, vendor, portfolio-wide or per property
- ✅ Documents: uploads (PDF/images/Word) stored per owner, linked to properties/tenants
- ✅ Reports: yearly revenue/expenses/profit with **year selector**, expense category breakdown, occupancy
- ✅ Notifications: in-app feed + **daily cron** (`/api/cron/notifications`, `CRON_SECRET`-protected, wired in `vercel.json`) for upcoming/late payments and expiring contracts
- ✅ Tests: Vitest unit suite for validators, formatting, pagination and error mapping (`npm test`)

### Roadmap

Airbnb/Booking sync · calendar integrations · WhatsApp notifications · Stripe · e-signature · maintenance requests · accounting & taxes · mobile app.

---

Built with a production mindset: strict TypeScript, no `any`, Zod at every boundary, and a tenant wall enforced at the repository layer.
