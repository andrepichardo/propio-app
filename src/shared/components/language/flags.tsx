import { cn } from '@/shared/lib/utils';

/**
 * Inline SVG flags. We deliberately avoid emoji flags: Windows does not render
 * regional-indicator emoji as flags (it shows the letters), so a landlord on
 * Windows would see "US"/"DO" instead of a flag. SVG renders everywhere.
 *
 * Rounded corners come from an HTML wrapper with `overflow-hidden` (reliable
 * across browsers) rather than an SVG clipPath (whose ids can collide).
 *
 * The inner svg sizes with `!size-full`: menu/button containers apply generic
 * icon rules like `[&_svg]:size-4` that would otherwise squash the flag.
 */
function FlagFrame({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-block h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] leading-none ring-1 ring-black/10',
        className,
      )}
    >
      {children}
    </span>
  );
}

const RED = '#B22234';
const BLUE = '#3C3B6E';
const STRIPE = 14 / 13;

export function FlagUS({ className, label = 'English (United States)' }: { className?: string; label?: string }) {
  return (
    <FlagFrame label={label} className={className}>
      <svg viewBox="0 0 20 14" className="block !size-full" preserveAspectRatio="none">
        <rect width="20" height="14" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={i * STRIPE} width="20" height={STRIPE} fill={RED} />
        ))}
        <rect width="8.4" height={STRIPE * 7} fill={BLUE} />
        <g fill="#fff">
          {[1.3, 3.9, 6.5].map((cx) =>
            [1.3, 3.4, 5.5].map((cy) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.5" />
            )),
          )}
        </g>
      </svg>
    </FlagFrame>
  );
}

export function FlagDO({ className, label = 'Español (República Dominicana)' }: { className?: string; label?: string }) {
  const DO_BLUE = '#002D62';
  const DO_RED = '#CE1126';
  return (
    <FlagFrame label={label} className={className}>
      <svg viewBox="0 0 20 14" className="block !size-full" preserveAspectRatio="none">
        {/* White cross background shows through the gaps between quadrants. */}
        <rect width="20" height="14" fill="#fff" />
        <rect x="0" y="0" width="8.8" height="5.6" fill={DO_BLUE} />
        <rect x="11.2" y="0" width="8.8" height="5.6" fill={DO_RED} />
        <rect x="0" y="8.4" width="8.8" height="5.6" fill={DO_RED} />
        <rect x="11.2" y="8.4" width="8.8" height="5.6" fill={DO_BLUE} />
      </svg>
    </FlagFrame>
  );
}
