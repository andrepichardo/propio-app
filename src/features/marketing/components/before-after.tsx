'use client';

import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SectionHeading } from './section-heading';
import { Reveal } from './motion-primitives';

const PAINS = ['pain1', 'pain2', 'pain3', 'pain4', 'pain5'] as const;
const GAINS = ['gain1', 'gain2', 'gain3', 'gain4', 'gain5'] as const;

/**
 * The problem panel: the spreadsheet-and-WhatsApp status quo next to what
 * Propio replaces it with. It sits before the feature grid on purpose — a
 * visitor who has not yet named their own problem will not read a feature
 * list closely.
 */
export function BeforeAfter() {
  const t = useTranslations('landing.problem');

  return (
    <section className="relative py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          <Reveal from="left">
            <Panel
              tone="before"
              label={t('beforeLabel')}
              caption={t('beforeCaption')}
              items={PAINS.map((key) => ({ id: key, text: t(key) }))}
            />
          </Reveal>
          <Reveal from="right" delay={0.08}>
            <Panel
              tone="after"
              label={t('afterLabel')}
              caption={t('afterCaption')}
              items={GAINS.map((key) => ({ id: key, text: t(key) }))}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Panel({
  tone,
  label,
  caption,
  items,
}: {
  tone: 'before' | 'after';
  label: string;
  caption: string;
  /** `id` is the message key, so the row survives a locale change in place. */
  items: { id: string; text: string }[];
}) {
  const isAfter = tone === 'after';
  const Icon = isAfter ? Check : X;

  return (
    <div
      className={cn(
        'h-full rounded-2xl border p-6 sm:p-7',
        isAfter
          ? 'border-primary/30 bg-card shadow-card ring-1 ring-inset ring-primary/10'
          : 'bg-muted/30',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg',
            isAfter
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{caption}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3.5">
        {items.map((item, index) => (
          <Reveal
            key={item.id}
            delay={index * 0.06}
            distance={12}
            className="flex items-start gap-3"
          >
            <Icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                isAfter ? 'text-primary' : 'text-destructive/70',
              )}
            />
            <span
              className={cn(
                'text-sm leading-relaxed',
                isAfter ? 'text-foreground/90' : 'text-muted-foreground',
              )}
            >
              {item.text}
            </span>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
