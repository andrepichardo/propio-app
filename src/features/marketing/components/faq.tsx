'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SectionHeading } from './section-heading';
import { Reveal } from './motion-primitives';

const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

/**
 * FAQ accordion.
 *
 * Hand-rolled rather than pulled from Radix: `@radix-ui/react-accordion` is
 * not a dependency yet, and one disclosure list does not justify adding it.
 * Keyboard and screen-reader behaviour comes from real `<button>` elements
 * plus `aria-expanded` / `aria-controls`.
 */
export function Faq() {
  const t = useTranslations('landing.faq');
  const [open, setOpen] = React.useState<string | null>('q1');

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 border-t bg-muted/25 py-20 sm:py-28"
    >
      <div className="container">
        <SectionHeading
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />

        <Reveal className="mx-auto mt-14 max-w-3xl divide-y overflow-hidden rounded-2xl border bg-card">
          {QUESTIONS.map((key) => {
            const isOpen = open === key;
            return (
              <div key={key}>
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${key}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${key}`}
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 sm:px-6"
                  >
                    <span className="text-sm font-medium sm:text-base">
                      {t(`${key}.q`)}
                    </span>
                    <Plus
                      aria-hidden
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                        isOpen && 'rotate-45 text-primary',
                      )}
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="panel"
                      id={`faq-panel-${key}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${key}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                        {t(`${key}.a`)}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>

        {/* The address lives in the catalogues so changing it is one edit per
            locale, not a code change. */}
        <Reveal
          delay={0.1}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          {t('moreLead')}{' '}
          <Link
            href={`mailto:${t('email')}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('email')}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
