# Propio — agent notes

SaaS for independent landlords. Next.js 15 App Router · React 19 · TS strict · Prisma/PostgreSQL · Auth.js v5 · Tailwind + shadcn-style UI in `src/shared/components/ui`.

## Commands

- `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`
- DB: `npm run db:push` (dev), `db:migrate`, `db:seed` (demo@propio.app / Demo1234!)
- Copy `.env.example` → `.env`; minimum `DATABASE_URL` + `AUTH_SECRET`.

## Architecture rules (follow these when adding code)

- **Feature-based**: `src/features/<name>/{validators,repositories,services,actions,components}`. Routes in `src/app` stay thin and delegate.
- **Multi-tenancy is the law**: every domain table has `ownerId`. Repositories put `ownerId` in EVERY where clause. Get it via `requireOwnerId()` (`src/shared/lib/auth/session.ts`). Cross-entity writes (e.g. contract→property) must verify ownership first.
- **Server actions**: build with `createOwnerAction(schema, handler)` from `src/shared/lib/action.ts`. It handles auth + Zod + error→`ActionResult<T>` mapping. Client forms pattern-match `result.success` and use `applyFieldErrors` (`src/shared/hooks/use-server-action.ts`).
- **Errors**: throw typed errors from `src/shared/lib/errors.ts` in services; never leak raw errors to the client.
- **Soft deletes**: set `deletedAt`; never hard-delete domain rows. Reads filter `deletedAt: null`.
- **Money**: Prisma `Decimal(12,2)`. Format with helpers in `src/shared/lib/format.ts`; never do float math on display values.
- **Storage**: only through `getStorage()` (`src/shared/lib/storage`) — never import the Supabase driver directly.
- **Lists**: filters/pagination live in the URL query string, validated with a Zod `*FiltersSchema` before hitting services.
- **Every route section** gets `loading.tsx` (skeleton) + `error.tsx` (re-export `@/shared/components/route-error`).
- No `any`. `import 'server-only'` in server-only modules. Barrel exports per feature are optional; avoid importing server code into client bundles.

## Gotchas

- `middleware.ts` uses the edge-safe `auth.config.ts` (no Prisma/bcrypt). Node-only providers live in `auth.ts`.
- Receipt numbers are per-owner sequential, generated inside the payment transaction (`payment.service.ts`).
- PDF render + storage upload + tenant email run post-commit (`finalizeReceipt`) — never inside the payment transaction.
- Env is validated at boot in `src/shared/config/env.ts`; server env import from client code throws.
