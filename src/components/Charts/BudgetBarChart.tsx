'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { Currency } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import { Target } from 'lucide-react';

interface CustomTooltipData {
  payload: {
    name: string;
    fullName: string;
    budget: number;
    actual: number;
    percentage: number;
  };
}

function BudgetBarCustomTooltip({
  active,
  payload,
  currency = 'USD',
}: {
  active?: boolean;
  payload?: CustomTooltipData[];
  currency?: Currency;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{data.fullName}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">Budget Limit:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(data.budget, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">Actual Spent:</span>
            <span
              className={`font-semibold ${
                data.actual > data.budget
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {formatCurrency(data.actual, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-1 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Utilization:</span>
            <span
              className={`font-bold ${
                data.percentage >= 100
                  ? 'text-rose-600'
                  : data.percentage >= 75
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {data.percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function BudgetBarChart() {
  const { budgetStatuses, currency, formatCompactCurrency } = useFinance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Format data for bar chart
  const chartData = budgetStatuses
    .filter((b) => b.limit > 0 || b.spent > 0)
    .map((b) => ({
      name: b.category.split('&')[0].trim(), // shorten label for chart axis
      fullName: b.category,
      budget: b.limit,
      actual: Math.round(b.spent * 100) / 100,
      percentage: Math.round(b.percentage),
    }));

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Budget vs. Actual Spending
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare planned allowance against current burn rate
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No budget data defined.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => formatCompactCurrency(v)}
                dx={-4}
              />
              <Tooltip content={<BudgetBarCustomTooltip currency={currency} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Bar
                dataKey="budget"
                name="Budget Limit"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="actual"
                name="Actual Spent"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
