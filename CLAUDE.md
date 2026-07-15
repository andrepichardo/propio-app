# Propio — agent notes

SaaS for independent landlords. Next.js 15 App Router · React 19 · TS strict · Prisma 6/PostgreSQL (Supabase) · Auth.js v5 · next-intl v4 · Tailwind + shadcn-style UI in `src/shared/components/ui`.

## Commands

- **Yarn, not npm** (`yarn.lock` is the lockfile): `yarn dev` · `yarn build` · `yarn typecheck` · `yarn lint` · `yarn test`
- DB: `yarn db:push` (dev), `db:migrate`, `db:seed` (demo@propio.app / Demo1234!)
- Copy `.env.example` → `.env`; minimum `DATABASE_URL` + `AUTH_SECRET`.

## Environments (dev/prod are strictly separated)

- `.env` points at the **dev** Supabase project (`apsqhknnbwwgowrciuio`, us-west-2). Production is a separate project (`imeqnlqshmwomzaocczc`, us-east-2) whose env lives only in Vercel.
- **Vercel never touches the DB** — deploys run `prisma generate && next build` only. Schema changes must be applied to prod manually (`prisma db push` with prod `DATABASE_URL`/`DIRECT_URL` in the process env), ideally BEFORE pushing the code that needs them. Additive columns are safe with the old code still live.
- `prisma/seed.ts` has `assertNotProduction()` — never bypass it. Never run destructive scripts against prod credentials.
- Storage bucket `propio` (public) exists in both projects.
- Resend is in no-domain mode: emails only deliver to the account owner's address until a custom domain is verified. `EMAIL_FROM=onboarding@resend.dev`.

## Architecture rules (follow these when adding code)

- **Feature-based**: `src/features/<name>/{validators,repositories,services,actions,components}`. Routes in `src/app` stay thin and delegate.
- **Multi-tenancy is the law**: every domain table has `ownerId`. Repositories put `ownerId` in EVERY where clause. Get it via `requireOwnerId()` (`src/shared/lib/auth/session.ts`). Cross-entity writes (e.g. contract→property) must verify ownership first.
- **Server actions**: build with `createOwnerAction(schema, handler)` from `src/shared/lib/action.ts`. It handles auth + Zod + error→`ActionResult<T>` mapping. Client forms pattern-match `result.success` and use `applyFieldErrors` (`src/shared/hooks/use-server-action.ts`).
- **Errors**: throw typed errors from `src/shared/lib/errors.ts` in services; never leak raw errors to the client.
- **Soft deletes**: set `deletedAt`; never hard-delete domain rows. Reads filter `deletedAt: null`.
- **Money**: Prisma `Decimal(12,2)`. Format with helpers in `src/shared/lib/format.ts`; never do float math on display values.
- **Storage**: only through `getStorage()` (`src/shared/lib/storage`) — never import the Supabase driver directly. When re-uploading to a FIXED key (avatar, signature, receipt PDF), store the URL with `?v=${Date.now()}` to bust browser/CDN caches.
- **Lists**: filters/pagination live in the URL query string, validated with a Zod `*FiltersSchema` before hitting services.
- **Every route section** gets `loading.tsx` (skeleton) + `error.tsx` (re-export `@/shared/components/route-error`).
- No `any`. `import 'server-only'` in server-only modules. Barrel exports per feature are optional; avoid importing server code into client bundles.

## i18n (EN + Latin-American ES — everything user-visible is translated)

- next-intl v4, **cookie-based** (`NEXT_LOCALE`, no URL prefix). Infra in `src/i18n/`; catalogs in `src/messages/{en,es}.json` — every new string goes in BOTH.
- Client → `useTranslations('ns')`; async server → `getTranslations('ns')`; tab titles via `generateMetadata` + `meta` namespace.
- **Zod messages are i18n KEYS** from the `validation` namespace (e.g. `.min(1, 'firstNameRequired')`); `FormMessage` translates them with a `t.has()` fallback. Enum labels: constants export `*_VALUES`, render with `t(\`ns.${value}\`)`.
- `src/i18n/request.ts` honours an explicit `getTranslations({ locale })` BEFORE falling back to the cookie — required for `after()` callbacks and PDFs/emails rendered in the OWNER's language (normalize `prefs.locale` with `isLocale(x.slice(0, 2))` first; it may be a BCP-47 tag).
- **Activity feed is data-driven i18n**: `logActivity` takes `messageKey` + `params` stored in `Activity.metadata` as `{key, params}`; the dashboard translates at render via the `activity` namespace and falls back to the English `summary` for legacy rows. Notifications (`title`/`body`) still store English text — same pattern applies if ever requested.
- Language switcher uses **SVG flags** (`src/shared/components/language/`) — never emoji flags (Windows renders them as letters).

## Domain conventions

- **Dates**: date-only values (contract dates, paidAt/periodStart from `<input type="date">`, receipt issuedAt) are stored at **UTC midnight**. NEVER read them with local getters (UTC-4 shifts them a day/month back). Use `toDateInputValue()` / `formatDate()` from `format.ts` (UTC-midnight aware) and the same guard for month bucketing (see `monthKey` in `dashboard.service.ts`).
- **Currency**: every money row (contract/payment/expense/receipt) carries its own `currency`. The profile currency (`getUserPreferences`) is the DEFAULT for new contracts/expenses and the LABEL for dashboard/report aggregates. `formatCurrency` renders USD as a bare `$` and known LatAm codes with their prefix (DOP → `RD$`). **Single-currency assumption**: aggregates sum raw numbers across currencies — if mixed-currency contracts ever appear, group aggregates per currency (agreed plan; no FX conversion).
- **Phones**: use the shared `PhoneInput` (`ui/phone-input.tsx`, react-phone-number-input, default country DO, stores E.164); validate with `isPossiblePhoneNumber`; display with `formatPhone()`.
- **Receipts**: numbers are per-owner sequential, generated inside the payment transaction (`payment.service.ts`). PDF render + upload + tenant email run post-commit (`finalizeReceipt` → `receiptService.generatePdf`, idempotent) — never inside the transaction. The receipts page backfills missing PDFs with `after()`. The PDF template (`src/pdf/documents/receipt-document.tsx` + `receiptStyles`) mirrors the owner's paper format (navy bar, pink date/total, auto-notes incl. next-rent due date, signature over "RECIBIDO POR"). Owner signature: Settings → Profile upload → `User.signatureUrl` (storage key `signatures/{ownerId}`).
- **Auth**: credentials login REQUIRES a verified email (`EmailNotVerifiedError`, code `email_not_verified`); OAuth (Google/GitHub) skips verification by design (providers verify) and uses `allowDangerousEmailAccountLinking` deliberately. OAuth logins land on `/app?welcome=1` so `WelcomeToast` can fire (credentials toast client-side in the form).

## UI conventions

- Required fields: `<FormLabel required>` renders the red asterisk.
- Clickable table rows: stretched-link pattern — row `relative cursor-pointer`, the row's main `<Link>` gets `after:absolute after:inset-0` (used in tenants + contracts lists). Don't apply where rows carry multiple actions.
- KPI tiles: use the shared `StatCard` (`src/shared/components/stat-card.tsx`); its value already handles long amounts (`min-w-0 break-words`, responsive size).

## Gotchas

- `middleware.ts` uses the edge-safe `auth.config.ts` (no Prisma/bcrypt). Node-only providers live in `auth.ts`.
- Env is validated at boot in `src/shared/config/env.ts`; server env import from client code throws.
- **Windows EPERM on `prisma generate`**: the dev server locks the query-engine DLL. Stop all node processes before `yarn build`/`db:push` (or use `prisma db push --skip-generate` when the client is already current), then relaunch `yarn dev`.
- Never run two dev servers at once — they share `.next` and corrupt each other (500s). If `.next` breaks (`Cannot find module './vendor-chunks/...'`), delete it.
- GitHub OAuth apps allow only ONE callback URL (prod vs localhost); Google allows several.
