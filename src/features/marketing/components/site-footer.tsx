import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Logo } from '@/shared/components/brand/logo';

type FooterLink = { href: string; key: string };

const PRODUCT_LINKS: FooterLink[] = [
  { href: '/#features', key: 'features' },
  { href: '/#how-it-works', key: 'howItWorks' },
  { href: '/#use-cases', key: 'useCases' },
  { href: '/#faq', key: 'faq' },
];

const SIGNED_IN_LINKS: FooterLink[] = [
  { href: '/app', key: 'dashboard' },
  { href: '/app/settings', key: 'settings' },
];

const SIGNED_OUT_LINKS: FooterLink[] = [
  { href: '/register', key: 'register' },
  { href: '/login', key: 'signIn' },
];

const LEGAL_LINKS: FooterLink[] = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
];

const LINK_CLASS =
  'text-sm text-muted-foreground transition-colors hover:text-foreground';

export async function SiteFooter({ authed }: { authed: boolean }) {
  const t = await getTranslations('landing.footer');

  const columns = [
    { key: 'product', links: PRODUCT_LINKS },
    { key: 'account', links: authed ? SIGNED_IN_LINKS : SIGNED_OUT_LINKS },
    { key: 'legal', links: LEGAL_LINKS },
  ];

  return (
    <footer className="border-t bg-muted/25">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="min-w-0">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t('tagline')}
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.key} className="min-w-0">
              <h2 className="text-sm font-semibold">{t(column.key)}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    {link.href.includes('#') ? (
                      <a href={link.href} className={LINK_CLASS}>
                        {t(link.key)}
                      </a>
                    ) : (
                      <Link href={link.href} className={LINK_CLASS}>
                        {t(link.key)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} Propio. {t('rights')}
          </p>
          <p className="text-center text-sm text-muted-foreground sm:text-right">
            {t('madeIn')}
          </p>
        </div>
      </div>
    </footer>
  );
}
