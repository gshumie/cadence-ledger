'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { Target, AlertTriangle, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';

interface BudgetManagerProps {
  onOpenBudgetModal: () => void;
}

export function BudgetManager({ onOpenBudgetModal }: BudgetManagerProps) {
  const { budgetStatuses } = useFinance();

  const totalBudgeted = budgetStatuses.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgetStatuses.reduce((acc, b) => acc + b.spent, 0);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Budget Planning & Limits
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time tracking of planned allowances and spending thresholds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400">Total Budgeted</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSpent)} / <span className="text-slate-500">{formatCurrency(totalBudgeted)}</span>
            </p>
          </div>
          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Budgets</span>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Overall Monthly Budget Utilization
          </span>
          <span
            className={`font-bold ${
              overallPercentage >= 100
                ? 'text-rose-600 dark:text-rose-400'
                : overallPercentage >= 75
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {overallPercentage.toFixed(1)}% ({formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)})
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage >= 100
                ? 'bg-rose-500'
                : overallPercentage >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, overallPercentage))}%` }}
          />
        </div>
      </div>

      {/* Grid of category budgets */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {budgetStatuses.map((item) => {
          let statusBadge = (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              On Track
            </span>
          );
          let barColor = 'bg-emerald-500';

          if (item.isExceeded) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3 w-3" />
                Exceeded
              </span>
            );
            barColor = 'bg-rose-500';
          } else if (item.isWarning) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Near Limit
              </span>
            );
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={item.category}
              className={`rounded-xl border p-3.5 transition-all ${
                item.isExceeded
                  ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                  : item.isWarning
                  ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.category}
                </span>
                {statusBadge}
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {formatCurrency(item.spent)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  of {formatCurrency(item.limit)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{item.percentage.toFixed(0)}% used</span>
                <span>
                  {item.isExceeded
                    ? `Over by ${formatCurrency(item.spent - item.limit)}`
                    : `${formatCurrency(item.remaining)} left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
