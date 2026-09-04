'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Aurora, GridPattern } from './backdrop';
import { AppPreview } from './app-preview';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Landing hero.
 *
 * The product shot sits on a 3D stage: it starts tilted back and straightens
 * as the visitor scrolls (scroll drives `rotateX`/`scale`), while the pointer
 * adds a small `rotateY` on a NESTED layer so the two transforms compose
 * instead of overwriting each other. Three chips float around it at different
 * parallax speeds. All of it collapses to a static shot under
 * `prefers-reduced-motion`.
 */
export function Hero({ authed }: { authed: boolean }) {
  const t = useTranslations('landing');
  const reduce = useReducedMotion();
  const stageRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'start 0.15'],
  });

  const spring = { stiffness: 120, damping: 30, mass: 0.6 };
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [26, 0]),
    spring,
  );
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 1], [0.9, 1]),
    spring,
  );
  // Chips drift at three different rates — the depth cue that sells parallax.
  const driftSlow = useTransform(scrollYProgress, [0, 1], [50, -18]);
  const driftMid = useTransform(scrollYProgress, [0, 1], [80, -34]);
  const driftFast = useTransform(scrollYProgress, [0, 1], [110, -52]);

  // Pointer tilt, normalised to [-1, 1] across the stage.
  const pointerX = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-7, 7]), {
    stiffness: 150,
    damping: 20,
  });

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
  }

  // The section is pulled up under the sticky header (h-16) and padded back
  // out, so the aurora and grid paint BEHIND it while it is still transparent —
  // otherwise the page opens with a flat strip above the gradient.
  return (
    <section className="relative isolate -mt-16 overflow-hidden pt-30 pb-16 sm:pt-36 sm:pb-24">
      <Aurora />
      <GridPattern />

      <div className="relative container">
        {/* max-w-4xl, not 3xl, so the HEADLINE gets two lines in both locales.
            At 3xl (768px) "Gestiona tus propiedades" lands within a few px of
            the limit at lg's 4.25rem and spills to a third line, while the
            shorter English line still fits — the two languages looked
            different for no reason. Only the h1 uses the extra width: the
            lead paragraph keeps its own max-w-2xl and everything else is
            auto-width and centred. */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="bg-background/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-xs backdrop-blur-sm"
          >
            <ShieldCheck className="text-primary size-3.5" />
            {t('badge')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            className="mt-6 text-4xl leading-[1.06] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]"
          >
            {t('heroTitleLead')}{' '}
            <span className="relative inline-block">
              <span className="from-primary via-primary dark:from-primary bg-linear-to-br to-violet-500 bg-clip-text text-transparent dark:via-violet-300 dark:to-sky-300">
                {t('heroTitleAccent')}
              </span>
              {/* Hand-drawn underline that sweeps in after the headline lands. */}
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="text-primary/40 absolute -bottom-1 left-0 h-2.5 w-full"
              >
                <motion.path
                  d="M2 8.5C48 3.5 104 2 150 3.5S250 8 298 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
            className="text-muted-foreground mt-6 max-w-2xl text-base text-balance sm:text-lg"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
            className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="group shadow-primary/20 shadow-lg"
            >
              <Link href={authed ? '/app' : '/register'}>
                {authed ? t('goToDashboard') : t('startFree')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="backdrop-blur-sm"
            >
              {/* Plain anchor, not `next/link` — see the note in site-header. */}
              <a href="#how-it-works">
                <Sparkles className="size-4" />
                {t('seeHowItWorks')}
              </a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="text-muted-foreground mt-5 text-xs"
          >
            {t('heroReassurance')}
          </motion.p>
        </div>

        {/* 3D product stage */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => pointerX.set(0)}
          className="relative mx-auto mt-14 max-w-5xl sm:mt-20"
          style={{ perspective: '1600px' }}
        >
          {/* Glow pooling under the shot, so it reads as lifted off the page. */}
          <div
            aria-hidden
            className="bg-primary/25 absolute inset-x-6 -bottom-6 h-24 rounded-[50%] blur-3xl"
          />

          <motion.div
            style={
              reduce
                ? undefined
                : { rotateX, scale, transformStyle: 'preserve-3d' }
            }
            className="relative origin-top"
          >
            <motion.div style={reduce ? undefined : { rotateY }}>
              <AppPreview />
            </motion.div>
          </motion.div>

          <FloatingChip
            drift={driftFast}
            reduce={reduce}
            className="top-24 -left-10"
            icon={<CheckCircle2 className="text-success size-4" />}
            title={t('hero.floatReceiptTitle')}
            caption={t('hero.floatReceiptCaption')}
          />
          <FloatingChip
            drift={driftMid}
            reduce={reduce}
            className="top-14 -right-12"
            icon={<BellRing className="text-primary size-4" />}
            title={t('hero.floatReminderTitle')}
            caption={t('hero.floatReminderCaption')}
          />
          <FloatingChip
            drift={driftSlow}
            reduce={reduce}
            className="-right-8 bottom-10"
            icon={
              <span className="text-primary text-[13px] font-semibold">
                {'≈'}
              </span>
            }
            title={t('hero.floatFxTitle')}
            caption={t('hero.floatFxCaption')}
          />
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  drift,
  reduce,
  className,
  icon,
  title,
  caption,
}: {
  drift: MotionValue<number>;
  reduce: boolean | null;
  className?: string;
  icon: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <motion.div
      style={reduce ? undefined : { y: drift }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      className={cn('absolute z-10 hidden lg:block', className)}
    >
      <div className="bg-background/85 shadow-card flex items-center gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-md">
        <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold whitespace-nowrap">{title}</p>
          <p className="text-muted-foreground text-[11px] whitespace-nowrap">
            {caption}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
