'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { Currency } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp } from 'lucide-react';

interface CustomTooltipPayload {
  dataKey?: string;
  value?: number;
}

function CashFlowCustomTooltip({
  active,
  payload,
  label,
  currency = 'USD',
}: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
  currency?: Currency;
}) {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expenses = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
    const net = income - expenses;

    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Income:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(income, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Expenses:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(expenses, currency)}
            </span>
          </div>
          <div className="mt-2 border-t border-slate-200 pt-1.5 dark:border-slate-700 flex items-center justify-between gap-4 font-bold">
            <span className="text-slate-600 dark:text-slate-300">Net Flow:</span>
            <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {formatCurrency(net, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function CashFlowChart() {
  const { monthlyChartData, currency, formatCompactCurrency } = useFinance();
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

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cash Flow Trend
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monthly income vs expense performance
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Expenses
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        {monthlyChartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No transaction records found for cash flow analysis.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(v) => formatCompactCurrency(v)}
                dx={-4}
              />
              <Tooltip content={<CashFlowCustomTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
