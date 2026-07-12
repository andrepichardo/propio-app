'use client';

import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyReportRow } from '../services/report.service';
import { formatCompactCurrency, formatCurrency } from '@/shared/lib/format';

/**
 * Categorical palette (brand-neutral, colour-blind-safe ordering) used for the
 * expense breakdown. Kept small and high-contrast against white cards.
 */
const CATEGORY_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

export function ProfitBarChart({
  data,
  currency,
}: {
  data: MonthlyReportRow[];
  currency: string;
}) {
  const t = useTranslations('reports');
  const seriesLabel = (name: string) =>
    name === 'revenue' ? t('chartRevenue') : t('chartExpenses');
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(v: number) => formatCompactCurrency(v, currency)}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            formatCurrency(value, currency),
            seriesLabel(name),
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v: string) => seriesLabel(v)}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdownChart({
  data,
  currency,
}: {
  data: { label: string; value: number }[];
  currency: string;
}) {
  const t = useTranslations('reports');
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        {t('noExpenses')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            fontSize: 12,
          }}
          formatter={(value: number) => formatCurrency(value, currency)}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
