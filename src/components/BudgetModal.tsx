'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { ExpenseCategory } from '@/types/finance';
import { EXPENSE_CATEGORIES, formatCurrency } from '@/utils/formatters';
import { X, Check, Target } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetModal({ isOpen, onClose }: BudgetModalProps) {
  const { budgets, updateBudget } = useFinance();
  const [localLimits, setLocalLimits] = useState<Record<ExpenseCategory, number>>(
    {} as Record<ExpenseCategory, number>
  );

  useEffect(() => {
    const limitsMap = {} as Record<ExpenseCategory, number>;
    EXPENSE_CATEGORIES.forEach((cat) => {
      const match = budgets.find((b) => b.category === cat);
      limitsMap[cat] = match ? match.limit : 0;
    });
    setLocalLimits(limitsMap);
  }, [budgets, isOpen]);

  if (!isOpen) return null;

  const handleLimitChange = (cat: ExpenseCategory, value: string) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setLocalLimits((prev) => ({
      ...prev,
      [cat]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    EXPENSE_CATEGORIES.forEach((cat) => {
      updateBudget(cat, localLimits[cat] || 0);
    });
    onClose();
  };

  const totalMonthlyCap = Object.values(localLimits).reduce((acc, v) => acc + (v || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Monthly Spending Budgets
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set monthly spending targets and alert thresholds for each category
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Cap preview */}
        <div className="bg-slate-50 px-6 py-3 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Total Monthly Expense Budget:
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalMonthlyCap)} / mo
          </span>
        </div>

        {/* Scrollable inputs */}
        <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cat}
                  </label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="25"
                      min="0"
                      value={localLimits[cat] ?? 0}
                      onChange={(e) => handleLimitChange(cat, e.target.value)}
                      className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 text-xs font-bold text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Changes update real-time alerts instantly
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                <Check className="h-4 w-4" />
                <span>Save Budgets</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
