'use client';

import { useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/shared/lib/format';

type Point = {
  month: string;
  revenue: number;
  expenses: number;
  revenueApprox: boolean;
  expensesApprox: boolean;
};

/**
 * Revenue vs expenses area chart. Colours come from CSS variables so the chart
 * automatically tracks the theme (light/dark) with no JS.
 */
export function RevenueChart({
  data,
  currency,
}: {
  data: Point[];
  currency: string;
}) {
  const t = useTranslations('dashboard');
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.2} />
            <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
        />
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
          tickFormatter={(value: number) =>
            formatCompactCurrency(value, currency)
          }
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border))' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            fontSize: 12,
            boxShadow: '0 4px 12px -4px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          formatter={(value: number, name: string, item) => {
            const point = item?.payload as Point | undefined;
            const approx =
              name === 'revenue'
                ? point?.revenueApprox
                : point?.expensesApprox;
            return [
              `${approx ? '≈ ' : ''}${formatCurrency(value, currency)}`,
              name === 'revenue' ? t('revenue') : t('expenses'),
            ];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(var(--warning))"
          strokeWidth={2}
          fill="url(#expenseFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
