'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Logo } from '@/shared/components/brand/logo';
import { Aurora, GridPattern } from './backdrop';
import { Reveal } from './motion-primitives';

const POINTS = ['point1', 'point2', 'point3'] as const;

/** Closing conversion panel. Mirrors the hero so the page bookends itself. */
export function FinalCta({ authed }: { authed: boolean }) {
  const t = useTranslations('landing.cta');

  return (
    <section className="relative py-20 sm:py-28">
      <div className="container">
        <Reveal className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-card sm:px-12 sm:py-20">
          <Aurora intensity="soft" />
          <GridPattern fade="center" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <Logo showWordmark={false} className="h-11" />

            <h2 className="mt-7 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
              {t('description')}
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                size="lg"
                asChild
                className="group shadow-lg shadow-primary/20"
              >
                <Link href={authed ? '/app' : '/register'}>
                  {authed ? t('dashboard') : t('primary')}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              {!authed ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">{t('secondary')}</Link>
                </Button>
              ) : null}
            </div>

            <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-primary" />
                  {t(point)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
