import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
