import { cn } from '@/shared/lib/utils';
import { Reveal } from './motion-primitives';

/**
 * The one heading block every marketing section uses: eyebrow, title, lead.
 * Keeping it here is what makes the vertical rhythm of the page consistent.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'flex flex-col',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl',
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
