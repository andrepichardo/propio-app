import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (required as of Prisma 7 — the `url`/`directUrl`
 * properties are no longer allowed in `schema.prisma`, and `.env` is no longer
 * auto-loaded, hence the `dotenv/config` import above).
 *
 * This URL is used by the CLI only (`db push`, `db execute`, `migrate diff`,
 * `db seed`). It deliberately prefers `DIRECT_URL`: those commands run DDL,
 * which must not go through Supabase's pgbouncer transaction pooling on port
 * 6543. That is exactly what the old `datasource.directUrl` did.
 *
 * The RUNTIME connection is configured separately, in `src/shared/lib/prisma.ts`,
 * where the pg driver adapter gets the pooled `DATABASE_URL`.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
