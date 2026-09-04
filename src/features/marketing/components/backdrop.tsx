import { cn } from '@/shared/lib/utils';

/**
 * Decorative backdrops for the marketing pages. Pure CSS (no images, no
 * client JS) so they cost nothing on first paint and theme themselves off the
 * same tokens as the app.
 */

/** Soft drifting brand-indigo blooms. Sits behind the hero and the final CTA. */
export function Aurora({
  className,
  intensity = 'default',
}: {
  className?: string;
  intensity?: 'default' | 'soft';
}) {
  const opacity = intensity === 'soft' ? 'opacity-60' : 'opacity-100';

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        opacity,
        className,
      )}
    >
      <div className="animate-aurora-drift bg-primary/25 dark:bg-primary/20 absolute -top-48 left-1/2 size-184 -translate-x-1/2 rounded-full blur-[130px] motion-reduce:animate-none" />
      <div className="animate-aurora-drift absolute top-24 -left-32 size-120 rounded-full bg-violet-400/20 blur-[120px] [animation-delay:-7s] motion-reduce:animate-none dark:bg-violet-500/15" />
      <div className="animate-aurora-drift absolute top-10 -right-24 size-136 rounded-full bg-sky-400/20 blur-[120px] [animation-delay:-14s] motion-reduce:animate-none dark:bg-sky-500/12" />
    </div>
  );
}

/**
 * Faint graph-paper grid, faded out with a radial mask so it never reads as a
 * hard edge. `fade` picks which side of the section the grid survives on.
 */
export function GridPattern({
  className,
  fade = 'top',
}: {
  className?: string;
  fade?: 'top' | 'center' | 'bottom';
}) {
  const mask =
    fade === 'top'
      ? 'mask-[radial-gradient(ellipse_65%_55%_at_50%_0%,#000_55%,transparent_100%)]'
      : fade === 'bottom'
        ? 'mask-[radial-gradient(ellipse_65%_55%_at_50%_100%,#000_55%,transparent_100%)]'
        : 'mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_45%,transparent_100%)]';

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        'bg-[linear-gradient(to_right,hsl(var(--foreground)/0.055)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.055)_1px,transparent_1px)]',
        'bg-size-[56px_56px]',
        mask,
        className,
      )}
    />
  );
}

/** Thin gradient hairline used to separate stacked sections. */
export function GradientRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'via-border h-px w-full bg-linear-to-r from-transparent to-transparent',
        className,
      )}
    />
  );
}
