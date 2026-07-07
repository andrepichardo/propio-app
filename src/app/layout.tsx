import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/shared/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Propio — Manage your properties with confidence',
    template: '%s · Propio',
  },
  description:
    'Propio is the all-in-one operating system for independent landlords. Manage properties, tenants, contracts, payments, and reports from one place.',
  applicationName: 'Propio',
  keywords: [
    'property management',
    'landlord software',
    'rental management',
    'tenants',
    'leases',
  ],
  authors: [{ name: 'Propio' }],
  openGraph: {
    title: 'Propio',
    description: 'Manage your properties with confidence.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1115' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
