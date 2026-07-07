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
    <Card className={cn('transition-shadow hover:shadow-card', className)}>
      <CardContent className="p-5">
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
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hasTrend ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
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
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
