import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Providers } from '@/shared/components/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('site');
  return {
    title: {
      default: t('title'),
      template: '%s · Propio',
    },
    description: t('description'),
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
      description: t('ogDescription'),
      type: 'website',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1115' },
  ],
};

/**
 * Namespaces no client component ever reads. Left in, `NextIntlClientProvider`
 * serialises the WHOLE catalogue into every page's HTML — and these three are
 * the long-form ones: the legal documents, the PDF templates and the email
 * copy, all rendered on the server via `getTranslations({ locale, namespace })`.
 * Dropping them keeps a few dozen KB of prose out of every single page load.
 * If a client component ever needs one of these, remove it from this list.
 */
const SERVER_ONLY_NAMESPACES = ['legal', 'pdf', 'emails'];

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(
      ([namespace]) => !SERVER_ONLY_NAMESPACES.includes(namespace),
    ),
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <NextIntlClientProvider messages={clientMessages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
