'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  BellRing,
  Check,
  Coins,
  FileStack,
  Image as ImageIcon,
  PieChart,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SectionHeading } from './section-heading';
import { SpotlightCard } from './spotlight-card';
import { Reveal } from './motion-primitives';

/**
 * Feature bento. A 6-column grid on desktop so tiles can claim different
 * widths — the asymmetry is what stops a feature list from reading like a
 * spreadsheet. Three tiles carry a small live visual; the rest stay icon-led
 * so the eye has somewhere to rest.
 */
const TILES = [
  { key: 'payments', icon: Wallet, span: 'lg:col-span-4', visual: 'payment' },
  { key: 'receipts', icon: Receipt, span: 'lg:col-span-2' },
  { key: 'reports', icon: PieChart, span: 'lg:col-span-2', visual: 'chart' },
  { key: 'multiCurrency', icon: Coins, span: 'lg:col-span-2', visual: 'fx' },
  { key: 'reminders', icon: BellRing, span: 'lg:col-span-2' },
  { key: 'documents', icon: FileStack, span: 'lg:col-span-3', visual: 'files' },
  { key: 'security', icon: ShieldCheck, span: 'lg:col-span-3' },
] as const;

export function FeatureBento() {
  const t = useTranslations('landing.features');

  return (
    <section
      id="features"
      className="relative scroll-mt-6 py-20 sm:scroll-mt-0 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {TILES.map((tile, index) => (
            <Reveal
              key={tile.key}
              delay={index * 0.06}
              className={cn('flex', tile.span)}
            >
              <SpotlightCard className="flex w-full flex-col p-6">
                <FeatureIcon icon={tile.icon} />
                <h3 className="mt-4 text-base font-semibold">
                  {t(`${tile.key}Title`)}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t(`${tile.key}Desc`)}
                </p>
                {'visual' in tile && tile.visual ? (
                  <div className="mt-auto pt-6">
                    <FeatureVisual kind={tile.visual} />
                  </div>
                ) : null}
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="bg-primary/10 text-primary ring-primary/15 relative flex size-11 items-center justify-center rounded-xl ring-1 ring-inset">
      <Icon className="size-5" />
    </span>
  );
}

function FeatureVisual({
  kind,
}: {
  kind: 'payment' | 'chart' | 'fx' | 'files';
}) {
  const t = useTranslations('landing.features.visual');

  if (kind === 'payment') {
    return (
      <div className="bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
        <div className="bg-background min-w-0 flex-1 rounded-lg border px-3 py-2">
          <p className="text-muted-foreground truncate text-[11px]">
            {t('paymentLabel')}
          </p>
          <p className="truncate text-sm font-semibold tabular-nums">
            RD$ 28,500
          </p>
        </div>
        <ArrowRight className="text-muted-foreground size-4 shrink-0" />
        <div className="border-success/30 bg-success/5 min-w-0 flex-1 rounded-lg border px-3 py-2">
          <p className="text-success flex items-center gap-1 truncate text-[11px]">
            <Check className="size-3 shrink-0" />
            {t('receiptLabel')}
          </p>
          <p className="truncate text-sm font-semibold">REC-000142</p>
        </div>
      </div>
    );
  }

  if (kind === 'chart') {
    return (
      <div className="bg-muted/40 flex h-16 items-end gap-1.5 rounded-xl border p-3">
        {[38, 55, 44, 68, 60, 82, 74, 96].map((height, index) => (
          <div
            key={index}
            style={{ height: `${height}%` }}
            className={cn(
              'flex-1 rounded-sm',
              index > 5 ? 'bg-primary' : 'bg-primary/30',
            )}
          />
        ))}
      </div>
    );
  }

  if (kind === 'fx') {
    return (
      <div className="bg-muted/40 flex items-center justify-between gap-2 rounded-xl border p-3 text-sm">
        <span className="font-semibold tabular-nums">US$ 950</span>
        <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-primary font-semibold tabular-nums">
          {'≈ RD$ 57,950'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(['contract', 'id', 'invoice'] as const).map((doc) => (
        <span
          key={doc}
          className="bg-muted/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs"
        >
          <ImageIcon className="text-primary size-3.5 shrink-0" />
          {t(doc)}
        </span>
      ))}
    </div>
  );
}
