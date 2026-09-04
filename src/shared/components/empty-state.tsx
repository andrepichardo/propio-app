import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Beautiful, consistent empty state used across every list/collection view.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'animate-fade-in-up bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="bg-background shadow-soft mb-4 flex size-12 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-6" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
