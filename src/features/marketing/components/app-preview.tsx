'use client';

import { useTranslations } from 'next-intl';
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  LayoutDashboard,
  Users,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/shared/components/brand/logo';
import { cn } from '@/shared/lib/utils';

/**
 * A static, pixel-faithful mock of the Propio dashboard, used as the hero's
 * product shot. It is markup rather than a screenshot on purpose: it themes
 * itself with the app's own tokens, stays crisp at any density, translates
 * with the rest of the page, and never goes stale against a redesign.
 *
 * Every figure below is illustrative sample data.
 */

const NAV = [
  { icon: LayoutDashboard, key: 'navDashboard', active: true },
  { icon: FileText, key: 'navProperties', active: false },
  { icon: Users, key: 'navTenants', active: false },
  { icon: Wallet, key: 'navPayments', active: false },
  { icon: BarChart3, key: 'navReports', active: false },
] as const;

/** Twelve months of revenue, as a share of the tallest bar. */
const BARS = [46, 58, 52, 67, 61, 74, 70, 83, 78, 91, 86, 100];

const UPCOMING = [
  { unit: 'Piantini 502', due: 'Sep 1', amount: 'RD$ 42,000' },
  { unit: 'Torre Azul 3B', due: 'Sep 3', amount: 'RD$ 28,500' },
  { unit: 'Naco 14A', due: 'Sep 5', amount: 'US$ 950' },
];

export function AppPreview({ className }: { className?: string }) {
  const t = useTranslations('landing.preview');

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5 dark:ring-white/10',
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2.5 sm:px-4">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/60" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </div>
        <div className="mx-auto flex h-6 min-w-0 max-w-[15rem] flex-1 items-center justify-center rounded-md bg-background/80 px-3 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
          <span className="truncate">usepropio.com/app</span>
        </div>
        <span className="w-[42px]" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[10.5rem] shrink-0 flex-col gap-1 border-r bg-muted/30 p-3 sm:flex">
          <div className="mb-3 px-1">
            <Logo showWordmark={false} className="h-6" />
          </div>
          {NAV.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium',
                item.active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-3.5 shrink-0" />
              <span className="truncate">{t(item.key)}</span>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold sm:text-sm">
                {t('title')}
              </p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                {t('subtitle')}
              </p>
            </div>
            <span className="hidden shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-medium text-primary-foreground sm:inline-block">
              {t('cta')}
            </span>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Kpi label={t('kpiRevenue')} value="RD$ 184,500" trend="+12.4%" />
            <Kpi label={t('kpiExpenses')} value="RD$ 32,180" />
            <Kpi label={t('kpiOccupancy')} value="94%" trend="+3.0%" />
            <Kpi label={t('kpiPending')} value="RD$ 21,000" />
          </div>

          <div className="grid gap-2 lg:grid-cols-[1.55fr_1fr]">
            {/* Chart */}
            <div className="rounded-lg border bg-background p-3">
              <p className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                {t('chartTitle')}
              </p>
              <div className="mt-3 flex h-[4.5rem] items-end gap-[3px] sm:h-24 sm:gap-1">
                {BARS.map((height, index) => (
                  <div
                    key={index}
                    style={{ height: `${height}%` }}
                    className={cn(
                      'flex-1 rounded-sm',
                      index >= BARS.length - 3
                        ? 'bg-primary'
                        : 'bg-primary/25 dark:bg-primary/30',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Upcoming payments */}
            <div className="rounded-lg border bg-background p-3">
              <p className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                {t('upcomingTitle')}
              </p>
              <ul className="mt-2.5 space-y-2">
                {UPCOMING.map((row) => (
                  <li
                    key={row.unit}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-medium sm:text-[11px]">
                        {row.unit}
                      </p>
                      <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                        {row.due}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums sm:text-[11px]">
                      {row.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <p className="truncate text-[9px] text-muted-foreground sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1 truncate text-[11px] font-semibold tabular-nums sm:text-sm">
        {value}
      </p>
      {trend ? (
        <p className="mt-0.5 flex items-center gap-0.5 text-[9px] font-medium text-success">
          <ArrowUpRight className="size-2.5" />
          {trend}
        </p>
      ) : null}
    </div>
  );
}
