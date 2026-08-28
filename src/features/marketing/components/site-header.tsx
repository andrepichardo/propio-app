'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
  type Variants,
} from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/shared/components/brand/logo';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/language/language-switcher';
import { ThemeToggle } from '@/shared/components/theme-toggle';
import { cn } from '@/shared/lib/utils';

const panelVariants: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
  closed: (instant: boolean) => ({
    height: 0,
    opacity: 0,
    transition: instant
      ? { duration: 0 }
      : { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SECTIONS = [
  { href: '#features', key: 'navFeatures' },
  { href: '#how-it-works', key: 'navHowItWorks' },
  { href: '#use-cases', key: 'navUseCases' },
  { href: '#faq', key: 'navFaq' },
] as const;

export function SiteHeader({
  authed,
  onLanding = true,
}: {
  authed: boolean;
  /** The landing renders the sections; elsewhere the nav links back to them. */
  onLanding?: boolean;
}) {
  const t = useTranslations('landing');
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pendingHashRef = React.useRef<string | null>(null);
  const [instantClose, setInstantClose] = React.useState(false);

  // Off the landing the sections do not exist on this page, so the anchors
  // become cross-page links and the deferred-scroll dance is unnecessary.
  const sectionHref = (hash: string) => (onLanding ? hash : `/${hash}`);

  function handlePanelAnchor(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    event.preventDefault();
    pendingHashRef.current = href;
    setInstantClose(true);
    setMenuOpen(false);
  }

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 12);
  });

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled || menuOpen
          ? 'border-b bg-background/80 shadow-xs backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-3">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the full navigation is the point, see above */}
        <a href="/" className="shrink-0" aria-label="Propio">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.href}
              href={sectionHref(section.href)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(section.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {authed ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/app">
                {t('goToDashboard')} <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden h-9 lg:inline-flex"
              >
                <Link href="/login">{t('signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="h-9">
                <Link href="/register">{t('getStarted')}</Link>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t(menuOpen ? 'closeMenu' : 'openMenu')}
            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence
        initial={false}
        custom={instantClose}
        onExitComplete={() => {
          setInstantClose(false);
          const href = pendingHashRef.current;
          pendingHashRef.current = null;
          if (!href) return;
          const target = document.getElementById(href.slice(1));
          if (!target) return;
          history.pushState(null, '', href);
          target.scrollIntoView();
        }}
      >
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            variants={panelVariants}
            custom={instantClose}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute inset-x-0 top-full overflow-hidden border-b border-t bg-background/95 shadow-lg backdrop-blur-xl md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {SECTIONS.map((section) => (
                <a
                  key={section.href}
                  href={sectionHref(section.href)}
                  onClick={(event) => {
                    if (onLanding) handlePanelAnchor(event, section.href);
                    else setMenuOpen(false);
                  }}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {t(section.key)}
                </a>
              ))}
              {!authed ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {t('signIn')}
                </Link>
              ) : null}
              <div className="mt-2 flex items-center gap-2 px-3 sm:hidden">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
