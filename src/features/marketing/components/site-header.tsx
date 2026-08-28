'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/shared/components/brand/logo';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '@/shared/components/language/language-switcher';
import { ThemeToggle } from '@/shared/components/theme-toggle';
import { cn } from '@/shared/lib/utils';

/**
 * In-page anchors are plain `<a>`, never `next/link`.
 *
 * Next's segment-cache navigation builds the new canonical URL by string
 * concatenation — `route.canonicalUrl + url.hash` (segment-cache/navigation.js).
 * Once a route entry has been seeded from a URL that already carried a hash
 * (i.e. the visitor reloaded on `/#features`), every further hash navigation
 * appends instead of replacing: `/#features#features#features`. It affects the
 * relative and absolute forms equally, so `/#features` is not a workaround.
 * The browser's own fragment navigation has none of that, and a same-page
 * anchor needs no router, no prefetch and no RSC round-trip anyway.
 */

/** In-page anchors. Only rendered on the landing itself (`showNav`). */
const SECTIONS = [
  { href: '#features', key: 'navFeatures' },
  { href: '#how-it-works', key: 'navHowItWorks' },
  { href: '#use-cases', key: 'navUseCases' },
  { href: '#faq', key: 'navFaq' },
] as const;

/**
 * Marketing header, shared by the landing and the legal pages.
 *
 * It starts transparent over the hero and only grows its border + blur once
 * the page has scrolled, so the hero reads as full-bleed on load.
 */
export function SiteHeader({
  authed,
  showNav = true,
}: {
  authed: boolean;
  showNav?: boolean;
}) {
  const t = useTranslations('landing');
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pendingHashRef = React.useRef<string | null>(null);

  /**
   * Mobile-panel anchors defer their scroll until the panel has finished
   * closing. Left to the native fragment navigation, the tap's synchronous
   * React re-render + the panel's first exit-animation frame kill the smooth
   * scroll before it starts (browser-verified: hash changes, scrollY stays 0
   * — links=2 still in the DOM, y=0 from the first sample). Instant scroll
   * never hit this because it completes synchronously during navigation.
   */
  function handlePanelAnchor(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    event.preventDefault();
    pendingHashRef.current = href;
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
        {/* Plain <a>, not `next/link` — see the anchor note above: Next also
            resurrects a STALE hash from the route cache when navigating to
            `/`, so a visitor who reloaded on `/#reviews` would be sent back
            there. The logo must always land on the top of home. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the full navigation is the point, see above */}
        <a href="/" className="shrink-0" aria-label="Propio">
          <Logo />
        </a>

        {showNav ? (
          <nav className="hidden items-center gap-1 md:flex">
            {SECTIONS.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(section.key)}
              </a>
            ))}
          </nav>
        ) : null}

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

      {/* The panel OVERLAYS the page (absolute below the bar) instead of
          expanding the sticky header in normal flow. In flow, tapping an
          anchor raced the closing animation: the browser computed the target
          position with the menu open, then the collapse shifted the whole
          layout mid-scroll and the smooth scroll was cancelled or landed
          wrong — links looked dead on mobile. Overlaid, opening/closing moves
          nothing, so fragment navigation is never disturbed. */}
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          const href = pendingHashRef.current;
          pendingHashRef.current = null;
          if (!href) return;
          const target = document.getElementById(href.slice(1));
          if (!target) return;
          history.pushState(null, '', href);
          // No `behavior` on purpose: it defaults to the CSS scroll-behavior,
          // so this is smooth where allowed, instant under reduced motion,
          // and it honours each section's scroll-margin-top.
          target.scrollIntoView();
        }}
      >
        {menuOpen ? (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full overflow-hidden border-b border-t bg-background/95 shadow-lg backdrop-blur-xl md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {showNav
                ? SECTIONS.map((section) => (
                    <a
                      key={section.href}
                      href={section.href}
                      onClick={(event) =>
                        handlePanelAnchor(event, section.href)
                      }
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {t(section.key)}
                    </a>
                  ))
                : null}
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
