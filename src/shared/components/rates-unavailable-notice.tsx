import { getTranslations } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * Warns that some amounts were summed WITHOUT being converted, because the
 * exchange-rate service was unreachable (or has no rate for that currency).
 *
 * This deliberately does not reuse the `≈` marker: `≈` promises "converted,
 * so rounded", while this means "not converted at all" — adding RD$ to US$ at
 * 1:1 can be off by ~60×, and a total that wrong has to say so rather than
 * hide behind a tilde.
 */
export async function RatesUnavailableNotice({
  className,
}: {
  className?: string;
}) {
  const t = await getTranslations('fx');

  return (
    <div
      role="status"
      className={cn(
        'border-warning/30 bg-warning/10 flex items-start gap-3 rounded-lg border p-3 text-sm',
        className,
      )}
    >
      <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{t('unavailableTitle')}</p>
        <p className="text-muted-foreground">{t('unavailableBody')}</p>
      </div>
    </div>
  );
}
