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
    <section className="relative isolate -mt-16 overflow-hidden pb-16 pt-[7.5rem] sm:pb-24 sm:pt-36">
      <Aurora />
      <GridPattern />

      <div className="container relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur"
          >
            <ShieldCheck className="size-3.5 text-primary" />
            {t('badge')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.25rem]"
          >
            {t('heroTitleLead')}{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-br from-primary via-primary to-violet-500 bg-clip-text text-transparent dark:from-primary dark:via-violet-300 dark:to-sky-300">
                {t('heroTitleAccent')}
              </span>
              {/* Hand-drawn underline that sweeps in after the headline lands. */}
              <svg
                aria-hidden
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-1 left-0 h-2.5 w-full text-primary/40"
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
            className="mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
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
              className="group shadow-lg shadow-primary/20"
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
              className="backdrop-blur"
            >
              <Link href="#how-it-works">
                <Sparkles className="size-4" />
                {t('seeHowItWorks')}
              </Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-5 text-xs text-muted-foreground"
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
            className="absolute inset-x-6 -bottom-6 h-24 rounded-[50%] bg-primary/25 blur-3xl"
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
            className="-left-10 top-24"
            icon={<CheckCircle2 className="size-4 text-success" />}
            title={t('hero.floatReceiptTitle')}
            caption={t('hero.floatReceiptCaption')}
          />
          <FloatingChip
            drift={driftMid}
            reduce={reduce}
            className="-right-12 top-14"
            icon={<BellRing className="size-4 text-primary" />}
            title={t('hero.floatReminderTitle')}
            caption={t('hero.floatReminderCaption')}
          />
          <FloatingChip
            drift={driftSlow}
            reduce={reduce}
            className="-right-8 bottom-10"
            icon={
              <span className="text-[13px] font-semibold text-primary">
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
      <div className="flex items-center gap-2.5 rounded-xl border bg-background/85 px-3 py-2.5 shadow-card backdrop-blur-md">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="whitespace-nowrap text-xs font-semibold">{title}</p>
          <p className="whitespace-nowrap text-[11px] text-muted-foreground">
            {caption}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
