'use client';

import { useTranslations } from 'next-intl';
import { Quote, Star } from 'lucide-react';
import { getInitials } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { SectionHeading } from './section-heading';
import { Marquee, Reveal } from './motion-primitives';

/**
 * ⚠️ PLACEHOLDER COPY — REPLACE BEFORE THIS GOES LIVE.
 *
 * The six quotes behind these keys (`landing.reviews.r1…r6` in both message
 * catalogues) are written samples, not statements from real customers.
 * Shipping them as-is publishes testimonials nobody gave. Swap each one for a
 * quote you actually collected — and delete any key you have no quote for
 * rather than leaving the sample in place.
 *
 * The section renders whatever is in `REVIEW_KEYS`, so trimming the list is
 * the only change needed to ship with two real reviews instead of six.
 */
const REVIEW_KEYS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const;

export function Reviews() {
  const t = useTranslations('landing.reviews');

  const reviews = REVIEW_KEYS.map((key) => ({
    key,
    quote: t(`${key}.quote`),
    name: t(`${key}.name`),
    role: t(`${key}.role`),
  }));

  const half = Math.ceil(reviews.length / 2);

  return (
    <section id="reviews" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
      </div>

      <Reveal className="mt-14 space-y-4">
        <Marquee duration={64}>
          {reviews.slice(0, half).map(({ key, ...review }) => (
            <ReviewCard key={key} {...review} />
          ))}
        </Marquee>
        <Marquee duration={72} reverse>
          {reviews.slice(half).map(({ key, ...review }) => (
            <ReviewCard key={key} {...review} />
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}

function ReviewCard({
  quote,
  name,
  role,
  className,
}: {
  quote: string;
  name: string;
  role: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'mx-2 flex w-[19rem] shrink-0 flex-col rounded-2xl border bg-card p-6 shadow-soft transition-colors hover:border-primary/30 sm:w-[23rem]',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-3.5 fill-warning text-warning" />
          ))}
        </div>
        <Quote className="size-5 shrink-0 text-primary/25" />
      </div>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
        {quote}
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {getInitials(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
