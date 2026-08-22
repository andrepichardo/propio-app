import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // The only experiment we opt into, and it is load-bearing: without it
    // server actions cap request bodies at 1MB and document/photo uploads are
    // rejected. Next 16 still keeps `serverActions` under `experimental`, so
    // the "Experiments (use with caution)" line in the build output is
    // expected — not a misconfiguration.
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // NOTE: `optimizePackageImports` used to list lucide-react, date-fns and
    // recharts. Next 16 already ships all three in its default list, so the
    // entry only added noise to the experiments banner.
  },
  images: {
    remotePatterns: [
      // Supabase Storage public/render URLs. Host is read from the env at
      // build time so we never hardcode a project ref.
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  typescript: {
    // We run `tsc --noEmit` in CI; never silently ship type errors.
    ignoreBuildErrors: false,
  },
  // NOTE: the `eslint` option was removed in Next 16 — `next build` no longer
  // runs linting at all. Linting is its own step (`yarn lint`, ESLint CLI).
};

export default withNextIntl(nextConfig);
