'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AlertTriangle, AlertCircle, ChevronRight, X, Sparkles } from 'lucide-react';

interface InsightsBannerProps {
  onOpenBudgetModal: () => void;
}

export function InsightsBanner({ onOpenBudgetModal }: InsightsBannerProps) {
  const { budgetStatuses, summary, formatCurrency } = useFinance();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const exceeded = budgetStatuses.filter((b) => b.isExceeded);
  const warnings = budgetStatuses.filter((b) => b.isWarning);

  // If there are exceeded budgets
  if (exceeded.length > 0) {
    const topExceeded = exceeded[0];
    const overAmount = topExceeded.spent - topExceeded.limit;
    return (
      <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70 p-4 transition-all dark:border-rose-900/50 dark:bg-rose-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  Budget Limit Exceeded
                </span>
                <span className="rounded-full bg-rose-200/70 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-900/80 dark:text-rose-300">
                  {exceeded.length} {exceeded.length === 1 ? 'category' : 'categories'} over cap
                </span>
              </div>
              <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">
                You’ve exceeded your limit for <strong className="font-semibold">{topExceeded.category}</strong> by{' '}
                <span className="font-bold underline decoration-rose-400 decoration-2">{formatCurrency(overAmount)}</span> ({topExceeded.percentage.toFixed(0)}% used).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-500"
            >
              Adjust Budgets
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-rose-400 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-300"
              title="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If there are warning budgets (75% - 99%)
  if (warnings.length > 0) {
    const topWarning = warnings[0];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-4 transition-all dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Approaching Spending Cap
                </span>
                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/80 dark:text-amber-300">
                  {warnings.length} near limit
                </span>
              </div>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                You’ve consumed <strong className="font-semibold">{topWarning.percentage.toFixed(0)}%</strong> of your{' '}
                <strong className="font-semibold">{topWarning.category}</strong> budget. Only {formatCurrency(topWarning.remaining)} remains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-500"
            >
              Review Budgets
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300"
              title="Dismiss warning"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Positive health milestone banner
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-teal-50/60 p-4 transition-all dark:border-indigo-900/40 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-teal-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Cadence Financial Pulse
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Your spending is well within planned thresholds. Your monthly savings rate is{' '}
              <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.savingsRate.toFixed(1)}%
              </strong>
              , retaining {formatCurrency(summary.netSavings)} this cycle.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          title="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
