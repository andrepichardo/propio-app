import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
  /** Node rather than string so a page can render a live title (e.g. the
   *  dashboard's client-resolved greeting). */
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page title block used at the top of every dashboard route. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
