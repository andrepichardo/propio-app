'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { Building2, FileSignature, PieChart, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SectionHeading } from './section-heading';
import { Reveal } from './motion-primitives';

const STEPS = [
  { key: 'properties', icon: Building2 },
  { key: 'contracts', icon: FileSignature },
  { key: 'payments', icon: Wallet },
  { key: 'reports', icon: PieChart },
] as const;

/**
 * "How it works" timeline.
 *
 * The rail on the left is a gradient line whose `scaleY` is bound to the
 * section's scroll progress, so it draws itself downwards as the visitor
 * moves through the four steps. Dots light up as the line passes them.
 */
export function HowItWorks() {
  const t = useTranslations('landing.how');
  const railRef = React.useRef<HTMLOListElement>(null);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ['start 75%', 'end 65%'],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <section
      id="how-it-works"
      className="bg-muted/25 relative scroll-mt-6 border-y py-20 sm:scroll-mt-0 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <ol ref={railRef} className="relative mx-auto mt-16 max-w-3xl">
          {/* Rail: a static track with the progress line painted over it. */}
          <div
            aria-hidden
            className="bg-border absolute top-6 bottom-6 left-6 -ml-px w-px sm:left-7"
          >
            <motion.div
              style={{ scaleY: progress }}
              className="from-primary via-primary to-primary/30 h-full w-px origin-top bg-linear-to-b"
            />
          </div>

          {STEPS.map((step, index) => (
            <Step
              key={step.key}
              index={index}
              total={STEPS.length}
              progress={progress}
              icon={step.icon}
              step={t('step', { number: index + 1 })}
              title={t(`${step.key}Title`)}
              description={t(`${step.key}Desc`)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({
  index,
  total,
  progress,
  icon: Icon,
  step,
  title,
  description,
}: {
  index: number;
  total: number;
  progress: MotionValue<number>;
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
}) {
  // The dot activates once the rail has reached its own share of the section.
  const threshold = index / total;
  const active = useTransform(progress, (value) =>
    value >= threshold ? 1 : 0,
  );

  return (
    <li className={cn('relative flex gap-5 sm:gap-7', index > 0 && 'mt-10')}>
      <div className="relative z-10 shrink-0">
        <motion.span
          style={{ opacity: active }}
          aria-hidden
          className="bg-primary/20 absolute inset-0 rounded-2xl blur-md"
        />
        <span className="bg-background text-primary relative flex size-12 items-center justify-center rounded-2xl border shadow-xs sm:size-14">
          <Icon className="size-5 sm:size-6" />
        </span>
      </div>

      <Reveal className="min-w-0 flex-1 pt-1 pb-2" delay={index * 0.05}>
        <span className="text-primary text-xs font-semibold tracking-[0.14em] uppercase">
          {step}
        </span>
        <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
          {description}
        </p>
      </Reveal>
    </li>
  );
}
