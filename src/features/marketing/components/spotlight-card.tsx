'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Card that lights up under the cursor. The pointer position is written to CSS
 * custom properties and read by a radial-gradient overlay, so the effect costs
 * two style writes per move instead of a React re-render.
 */
export function SpotlightCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    node.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        'group/spot bg-card relative overflow-hidden rounded-2xl border',
        'transition-[transform,box-shadow,border-color] duration-300',
        'hover:border-primary/30 hover:shadow-card hover:-translate-y-1',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--primary) / 0.10), transparent 70%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
