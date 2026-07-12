import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  BarChart3,
  FileText,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/shared/components/brand/logo';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/language/language-switcher';
import { getCurrentUser } from '@/shared/lib/auth/session';

const features = [
  { icon: Wallet, key: 'payments' },
  { icon: Receipt, key: 'receipts' },
  { icon: BarChart3, key: 'reports' },
  { icon: FileText, key: 'documents' },
] as const;

export default async function LandingPage() {
  const user = await getCurrentUser();
  const t = await getTranslations('landing');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <Button asChild>
                <Link href="/app">
                  {t('goToDashboard')} <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">{t('signIn')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{t('getStarted')}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center py-24 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            {t('badge')}
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={user ? '/app' : '/register'}>
                {t('startFree')} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">{t('signIn')}</Link>
            </Button>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="animate-fade-in-up rounded-xl border bg-card p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">
                  {t(`features.${feature.key}Title`)}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t(`features.${feature.key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Propio. {t('footerNote')}
          </p>
        </div>
      </footer>
    </div>
  );
}
