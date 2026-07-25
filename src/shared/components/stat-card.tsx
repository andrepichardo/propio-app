import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent } from '@/shared/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Signed percentage change vs previous period, e.g. 12.4 or -3.1. */
  trend?: number;
  hint?: string;
  className?: string;
  accent?: 'default' | 'success' | 'warning' | 'destructive';
}

const accentStyles: Record<
  NonNullable<StatCardProps['accent']>,
  string
> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

/** KPI tile used on the dashboard. Shows a value, optional icon and trend. */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  className,
  accent = 'default',
}: StatCardProps) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend);
  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card
      className={cn('h-full transition-shadow hover:shadow-card', className)}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon ? (
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                accentStyles[accent],
              )}
            >
              <Icon className="size-[18px]" />
            </span>
          ) : null}
        </div>
        {/* The value owns the full card width; trend/hint live below so long
            amounts only wrap as a last resort. */}
        <p className="mt-3 min-w-0 break-words text-xl font-semibold tracking-tight xl:text-2xl">
          {value}
        </p>
        {/* mt-auto pins the footer to the bottom so secondary text aligns
            across cards of unequal content. */}
        {hasTrend || hint ? (
          <div className="mt-auto flex items-center gap-2 pt-1">
            {hasTrend ? (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-0.5 text-xs font-medium',
                  isPositive ? 'text-success' : 'text-destructive',
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5" />
                )}
                {Math.abs(trend ?? 0).toFixed(1)}%
              </span>
            ) : null}
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
