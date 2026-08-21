/**
 * Test-only stand-in for the `server-only` package, wired up in
 * `vitest.config.ts`. The real module throws when it is imported outside a
 * React Server Component; under Vitest (node environment) that guard has
 * nothing to enforce, and without this stub no server module could be
 * unit-tested at all.
 */
export {};
