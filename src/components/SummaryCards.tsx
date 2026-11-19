'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export function SummaryCards() {
  const { summary, selectedMonth } = useFinance();

  const isAllTime = selectedMonth === 'all';

  // Savings health status
  const getSavingsHealth = (rate: number) => {
    if (rate >= 30) return { label: 'Superb', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
    if (rate >= 20) return { label: 'Healthy', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' };
    if (rate >= 10) return { label: 'Moderate', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
    return { label: 'Attention', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' };
  };

  const health = getSavingsHealth(summary.savingsRate);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Net Balance / Period Net */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAllTime ? 'All-Time Balance' : 'Net Savings'}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Wallet className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {formatCurrency(summary.totalBalance)}
          </h3>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {!isAllTime && summary.savingsGrowth !== 0 && (
            <span
              className={`inline-flex items-center font-medium ${
                summary.savingsGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.savingsGrowth >= 0 ? (
                <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
              )}
              {formatPercentage(Math.abs(summary.savingsGrowth))}%
            </span>
          )}
          <span>{isAllTime ? 'Accumulated surplus' : 'vs previous month'}</span>
        </div>
      </div>

      {/* 2. Monthly Income */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAllTime ? 'Total Revenue' : 'Monthly Income'}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            {formatCurrency(summary.totalIncome)}
          </h3>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {!isAllTime && summary.incomeGrowth !== 0 && (
            <span
              className={`inline-flex items-center font-medium ${
                summary.incomeGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.incomeGrowth >= 0 ? (
                <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
              )}
              {formatPercentage(Math.abs(summary.incomeGrowth))}%
            </span>
          )}
          <span>{isAllTime ? 'All earnings' : 'vs last month'}</span>
        </div>
      </div>

      {/* 3. Total Expenses */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAllTime ? 'Total Outflow' : 'Total Expenses'}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 sm:text-3xl">
            {formatCurrency(summary.totalExpenses)}
          </h3>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {!isAllTime && summary.expenseGrowth !== 0 && (
            <span
              className={`inline-flex items-center font-medium ${
                summary.expenseGrowth <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.expenseGrowth > 0 ? (
                <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
              )}
              {formatPercentage(Math.abs(summary.expenseGrowth))}%
            </span>
          )}
          <span>
            {summary.totalIncome > 0
              ? `${Math.round((summary.totalExpenses / summary.totalIncome) * 100)}% of income`
              : 'total outflows'}
          </span>
        </div>
      </div>

      {/* 4. Savings Rate */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Savings Rate
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <PiggyBank className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {summary.savingsRate.toFixed(1)}%
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${health.color}`}>
            {health.label}
          </span>
        </div>

        <div className="mt-3">
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.savingsRate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
