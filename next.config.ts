import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are enabled by default in Next 15; tune the body size
    // limit so document/photo uploads via actions don't get rejected early.
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
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
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
