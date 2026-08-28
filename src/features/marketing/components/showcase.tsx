'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Check,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Reveal } from './motion-primitives';

/**
 * Alternating deep-dive rows. Each one pairs a claim with the artefact that
 * backs it, so the page shows the product instead of adjectives.
 *
 * The visuals drift slightly against the page scroll (a small `y` parallax),
 * which is what keeps a long marketing page from feeling like a static PDF.
 */
const ROWS = [
  { key: 'receipts', visual: 'receipt' },
  { key: 'reports', visual: 'report' },
  { key: 'reminders', visual: 'reminders' },
] as const;

export function Showcase() {
  const t = useTranslations('landing.showcase');

  return (
    <section className="relative py-20 sm:py-28">
      <div className="container space-y-24 sm:space-y-32">
        {ROWS.map((row, index) => (
          <ShowcaseRow
            key={row.key}
            flipped={index % 2 === 1}
            eyebrow={t(`${row.key}Eyebrow`)}
            title={t(`${row.key}Title`)}
            description={t(`${row.key}Desc`)}
            bullets={[
              t(`${row.key}Bullet1`),
              t(`${row.key}Bullet2`),
              t(`${row.key}Bullet3`),
            ]}
            visual={row.visual}
          />
        ))}
      </div>
    </section>
  );
}

function ShowcaseRow({
  flipped,
  eyebrow,
  title,
  description,
  bullets,
  visual,
}: {
  flipped: boolean;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: 'receipt' | 'report' | 'reminders';
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <div
      ref={ref}
      className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <Reveal
        from={flipped ? 'right' : 'left'}
        className={cn('min-w-0', flipped && 'lg:order-2')}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </span>
        <h3 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
        <ul className="mt-6 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="size-3" />
              </span>
              <span className="text-muted-foreground">{bullet}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <motion.div
        style={reduce ? undefined : { y }}
        className={cn('min-w-0', flipped && 'lg:order-1')}
      >
        <Reveal from={flipped ? 'left' : 'right'} distance={32}>
          {visual === 'receipt' ? (
            <ReceiptVisual />
          ) : visual === 'report' ? (
            <ReportVisual />
          ) : (
            <RemindersVisual />
          )}
        </Reveal>
      </motion.div>
    </div>
  );
}

/**
 * A miniature of the real receipt PDF — same navy bar, indigo property name
 * and pink total as `pdf/documents/receipt-document.tsx`. Those literals are
 * the owner's paper format, deliberately outside the app's theme tokens, so
 * they are written out here rather than pulled from the palette.
 */
function ReceiptVisual() {
  const t = useTranslations('landing.showcase.receipt');

  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border bg-white text-[#1f2430] shadow-card">
        <div className="h-2 w-full bg-[#2d3193]" />
        <div className="space-y-5 p-6 sm:p-7">
          <div>
            <p className="text-base font-bold text-[#6a6fdb]">Piantini 502</p>
            <p className="text-xs text-[#6b7280]">
              Av. Abraham Lincoln 1052, Santo Domingo
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold leading-tight text-[#2d3193]">
              {t('title')}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#ec138f]">
              27 {t('month')} 2026
            </p>
          </div>

          <dl className="space-y-2 text-xs">
            {(['tenant', 'concept', 'method'] as const).map((row, index) => (
              <div
                key={row}
                className="flex items-baseline justify-between gap-4 border-b border-[#e5e7eb] pb-2"
              >
                <dt className="text-[#6b7280]">{t(row)}</dt>
                <dd className="text-right font-medium">
                  {
                    [t('tenantValue'), t('conceptValue'), t('methodValue')][
                      index
                    ]
                  }
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex items-baseline justify-between rounded-lg bg-[#f3f4f6] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              {t('total')}
            </span>
            <span className="text-lg font-bold tabular-nums text-[#ec138f]">
              RD$ 42,000.00
            </span>
          </div>

          <div className="flex items-end justify-between gap-6 pt-2">
            <div className="min-w-0 flex-1">
              <svg
                viewBox="0 0 160 40"
                className="h-10 w-full text-[#1f2430]"
                aria-hidden
              >
                <path
                  d="M4 30c14-16 22 6 32-4s10-18 20-10 8 22 20 16 14-20 26-16 16 14 30 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-1 border-t border-[#1f2430] pt-1 text-[9px] font-semibold uppercase tracking-wide text-[#6b7280]">
                {t('signedBy')}
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-[#2d3193] px-2.5 py-1 text-[10px] font-semibold text-white">
              REC-000142
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportVisual() {
  const t = useTranslations('landing.showcase.report');
  const bars = [
    { revenue: 62, expense: 22 },
    { revenue: 71, expense: 26 },
    { revenue: 68, expense: 19 },
    { revenue: 84, expense: 31 },
    { revenue: 79, expense: 24 },
    { revenue: 96, expense: 28 },
  ];

  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
      />
      <div className="relative space-y-5 rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('period')}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <TrendingUp className="size-3" />
            +18.2%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { label: t('revenue'), value: 'RD$ 1.94M' },
              { label: t('expenses'), value: 'RD$ 386K' },
              { label: t('profit'), value: 'RD$ 1.55M' },
            ] as const
          ).map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-muted/30 p-3">
              <p className="truncate text-[10px] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex h-32 items-end gap-3">
          {bars.map((bar, index) => (
            <div key={index} className="flex flex-1 items-end gap-1">
              <div
                style={{ height: `${bar.revenue}%` }}
                className="flex-1 rounded-t-sm bg-primary"
              />
              <div
                style={{ height: `${bar.expense}%` }}
                className="flex-1 rounded-t-sm bg-primary/25"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-primary" />
            {t('revenue')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-primary/25" />
            {t('expenses')}
          </span>
        </div>
      </div>
    </div>
  );
}

function RemindersVisual() {
  const t = useTranslations('landing.showcase.reminders');

  const items = [
    {
      icon: AlertTriangle,
      tone: 'text-warning bg-warning/10',
      title: t('item1Title'),
      body: t('item1Body'),
      when: t('item1When'),
    },
    {
      icon: CalendarClock,
      tone: 'text-primary bg-primary/10',
      title: t('item2Title'),
      body: t('item2Body'),
      when: t('item2When'),
    },
    {
      icon: BellRing,
      tone: 'text-destructive bg-destructive/10',
      title: t('item3Title'),
      body: t('item3Body'),
      when: t('item3When'),
    },
  ];

  return (
    <div className="relative mx-auto max-w-md">
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
      />
      <div className="relative space-y-3 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between px-1 pb-1">
          <p className="text-sm font-semibold">{t('title')}</p>
          <span className="relative flex size-2.5">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary motion-reduce:animate-none" />
            <span className="relative size-2.5 rounded-full bg-primary" />
          </span>
        </div>

        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-xl border bg-background p-3.5 transition-colors hover:border-primary/30"
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                item.tone,
              )}
            >
              <item.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {item.when}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
