import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * Next.js dev mode hot-reloads modules, which would otherwise create a new
 * PrismaClient (and a new connection pool) on every change and exhaust the
 * database. We cache the instance on `globalThis` in non-production.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
