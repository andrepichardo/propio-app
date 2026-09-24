'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Building2, Check } from 'lucide-react';
import { BillingInterval, Plan } from '@/generated/prisma/enums';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { IntervalToggle } from '@/features/billing/components/interval-toggle';
import { PlanPrice } from '@/features/billing/components/plan-price';
import { PLAN_ORDER, PLANS } from '@/features/billing/plans';
import { SectionHeading } from './section-heading';
import { Reveal } from './motion-primitives';

const FEATURES = [
  'records',
  'receipts',
  'reports',
  'reminders',
  'currencies',
] as const;

/**
 * Pricing. Reads `PLANS`, the same table the server enforces, so the page can
 * never advertise a limit or a price the app does not apply. Every CTA leads
 * to sign-up (or, signed in, to the billing page): checkout needs an account
 * to attach the subscription to.
 */
export function Pricing({ authed }: { authed: boolean }) {
  const t = useTranslations('landing.pricing');
  const tp = useTranslations('plans');
  const tf = useTranslations('landing.faq');
  const [interval, setBillingInterval] = React.useState<BillingInterval>(
    BillingInterval.MONTH,
  );

  return (
    <section
      id="pricing"
      className="relative scroll-mt-6 py-20 sm:scroll-mt-0 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Reveal className="mt-10 flex justify-center">
          <IntervalToggle value={interval} onValueChange={setBillingInterval} />
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-3">
          {PLAN_ORDER.map((plan, index) => {
            const featured = plan === Plan.PRO;
            return (
              <Reveal key={plan} delay={index * 0.06} className="flex">
                <div
                  className={cn(
                    'bg-card relative flex w-full flex-col rounded-2xl border p-6',
                    featured &&
                      'border-primary ring-primary/20 shadow-card ring-4',
                  )}
                >
                  {featured ? (
                    <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold">
                      {tp('popular')}
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold">
                    {tp(`${plan}.name`)}
                  </h3>
                  <p className="text-muted-foreground mt-1 min-h-10 text-sm">
                    {tp(`${plan}.tagline`)}
                  </p>
                  <div className="mt-5">
                    <PlanPrice plan={plan} interval={interval} />
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium">
                    <Building2 className="text-primary size-4 shrink-0" />
                    {tp('propertyLimit', { limit: PLANS[plan].propertyLimit })}
                  </p>
                  <div className="mt-auto pt-6">
                    <Button
                      asChild
                      className="w-full"
                      variant={featured ? 'default' : 'outline'}
                    >
                      <Link href={authed ? '/app/billing' : '/register'}>
                        {authed
                          ? t('ctaDashboard')
                          : plan === Plan.FREE
                            ? t('ctaFree')
                            : t('ctaPaid', { plan: tp(`${plan}.name`) })}
                      </Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mx-auto mt-10 max-w-5xl">
          <p className="text-sm font-medium">{tp('featuresLabel')}</p>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="text-muted-foreground flex items-start gap-2 text-sm"
              >
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                {tp(`features.${feature}`)}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-8 text-center text-xs">
            {t('note')}
          </p>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {t('largePortfolio')}{' '}
            <a
              href={`mailto:${tf('email')}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {tf('email')}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
