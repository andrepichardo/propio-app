'use client';

import { useTranslations } from 'next-intl';
import {
  Building2,
  Coins,
  HeartHandshake,
  KeyRound,
  NotebookPen,
  Plane,
} from 'lucide-react';
import { SectionHeading } from './section-heading';
import { SpotlightCard } from './spotlight-card';
import { Reveal } from './motion-primitives';

/**
 * "Who it's for" persona grid.
 *
 * This slot used to hold a testimonial marquee, but every quote in it was
 * invented — the product has no real reviews yet, and fabricated endorsements
 * presented as genuine are deceptive advertising. These cards carry the same
 * social-proof weight honestly: they describe real landlord PROFILES the
 * product serves, in second person, with no names, no cities and no star
 * ratings — nothing that claims a person exists.
 *
 * A static grid on purpose (the old marquee visibly repeated its three cards
 * per row). When real, attributable testimonials exist, resurrect
 * `reviews.tsx` + the `landing.reviews` catalogue block from git history.
 */
const PERSONAS = [
  { key: 'first', icon: KeyRound },
  { key: 'notebook', icon: NotebookPen },
  { key: 'remote', icon: Plane },
  { key: 'family', icon: HeartHandshake },
  { key: 'currencies', icon: Coins },
  { key: 'portfolio', icon: Building2 },
] as const;

export function UseCases() {
  const t = useTranslations('landing.useCases');

  return (
    <section
      id="use-cases"
      className="relative scroll-mt-6 py-20 sm:scroll-mt-0 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona, index) => (
            <Reveal key={persona.key} delay={index * 0.06} className="flex">
              <SpotlightCard className="flex w-full flex-col p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                  <persona.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  {t(`${persona.key}Title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`${persona.key}Desc`)}
                </p>
                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {t(`${persona.key}Tag`)}
                  </span>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
