'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

/**
 * Shared motion helpers for the marketing pages.
 *
 * Everything here degrades to a plain opacity fade (or nothing at all) when
 * the visitor asks for reduced motion — the landing leans hard on scroll
 * animation, so honouring the preference is not optional.
 *
 * `Reveal` is deliberately the ONLY scroll-in primitive: it owns its own
 * `whileInView`, so it animates correctly however it got mounted. A
 * parent/child `staggerChildren` pair (the other idiomatic framer approach)
 * cannot promise that — with `once: true` the parent stops observing after it
 * fires, so any child that remounts afterwards inherits the parent's `hidden`
 * variant and is never told to become visible. That is not hypothetical here:
 * switching the language calls `router.refresh()`, and a list keyed by its own
 * translated text remounts every row. Stagger a group with per-item
 * `delay={index * step}` instead.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

type MotionDivProps = Omit<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'whileInView' | 'variants' | 'transition'
>;

interface RevealProps extends MotionDivProps {
  /** Seconds to wait before the element animates in. */
  delay?: number;
  /** Distance in px the element travels before settling. */
  distance?: number;
  /** Direction of travel. `up` is the default editorial feel. */
  from?: 'up' | 'down' | 'left' | 'right';
}

/** Fades + slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  from = 'up',
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();

  const offset = reduce
    ? {}
    : from === 'up'
      ? { y: distance }
      : from === 'down'
        ? { y: -distance }
        : from === 'left'
          ? { x: distance }
          : { x: -distance };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Edge-to-edge scrolling strip. A single track holds the children TWICE, so
 * the `-50%` keyframe lands exactly on the seam and the loop is seamless.
 * Edges are masked so items fade out instead of being clipped mid-glyph.
 */
export function Marquee({
  children,
  className,
  duration = 40,
  reverse = false,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Seconds for one full pass. */
  duration?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden',
        'mask-[linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]',
        className,
      )}
    >
      <div
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        className={cn(
          'flex w-max shrink-0 items-stretch',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
          'motion-reduce:animate-none',
        )}
      >
        <div className="flex shrink-0 items-stretch">{children}</div>
        <div aria-hidden className="flex shrink-0 items-stretch">
          {children}
        </div>
      </div>
    </div>
  );
}
