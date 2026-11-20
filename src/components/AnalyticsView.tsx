'use client';

import React, { useMemo } from 'react';
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
import {
  BarChart3,
  PieChart as PieIcon,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Percent,
  Filter,
} from 'lucide-react';

interface AnalyticsViewProps {
  onSelectCategoryFilter?: (category: string) => void;
}

interface CustomTooltipPayload {
  dataKey?: string;
  value?: number;
}

function CustomBarTooltip({
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
        <p className="mb-2 text-xs font-bold text-slate-800 dark:text-slate-100">{label}</p>
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
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Expenses:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(expenses, currency)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-1.5 dark:border-slate-700 flex items-center justify-between gap-4 font-bold">
            <span className="text-slate-600 dark:text-slate-300">Net Margin:</span>
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

export function AnalyticsView({ onSelectCategoryFilter }: AnalyticsViewProps) {
  const {
    transactions,
    selectedMonth,
    summary,
    monthlyChartData,
    categorySpendingData,
    currency,
    formatCurrency,
    formatCompactCurrency,
  } = useFinance();

  // Filter current period transactions
  const currentPeriodTxs = useMemo(() => {
    return selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const expenseTxs = currentPeriodTxs.filter((t) => t.type === 'expense');
    const methodMap: Record<string, { amount: number; count: number }> = {};
    let totalExpense = 0;

    expenseTxs.forEach((t) => {
      const method = t.paymentMethod || 'Other';
      if (!methodMap[method]) {
        methodMap[method] = { amount: 0, count: 0 };
      }
      methodMap[method].amount += t.amount;
      methodMap[method].count += 1;
      totalExpense += t.amount;
    });

    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    return Object.entries(methodMap)
      .map(([method, { amount, count }], idx) => ({
        method,
        amount: Math.round(amount * 100) / 100,
        count,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentPeriodTxs]);

  // Largest category
  const largestCategory = categorySpendingData.length > 0 ? categorySpendingData[0] : null;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Period Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.totalIncome)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {summary.incomeGrowth >= 0 ? '+' : ''}{summary.incomeGrowth.toFixed(1)}% vs previous cycle
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Period Expenses</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {summary.expenseGrowth >= 0 ? '+' : ''}{summary.expenseGrowth.toFixed(1)}% vs previous cycle
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Savings Efficiency</span>
            <Percent className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summary.savingsRate.toFixed(1)}%
            </span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              {summary.savingsRate >= 20 ? 'Healthy Target' : 'Below Target'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {formatCurrency(summary.netSavings)} retained
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Top Outflow Category</span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 truncate text-base font-bold text-slate-900 dark:text-white">
            {largestCategory ? largestCategory.category : 'N/A'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {largestCategory ? `${formatCurrency(largestCategory.amount)} (${largestCategory.percentage}%)` : 'No expenses'}
          </div>
        </div>
      </div>

      {/* Monthly Income vs Expense Comparison Chart */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Income vs. Expense Comparison
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative analysis across historical cycles from PostgreSQL
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          {monthlyChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No historical records available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={6} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  dx={-4}
                />
                <Tooltip content={<CustomBarTooltip currency={currency} />} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />
                <Bar dataKey="income" name="Monthly Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="Monthly Expenses" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Ranked Category Spending Table with Visual Bars */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-purple-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Spending by Category
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Itemized category rankings and percentage share
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {categorySpendingData.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No expense records found.</p>
            ) : (
              categorySpendingData.map((cat) => (
                <div key={cat.category} className="rounded-xl border border-slate-100 p-2.5 transition hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                      <span className="w-12 text-right font-medium text-slate-400">
                        {cat.percentage}%
                      </span>
                      {onSelectCategoryFilter && (
                        <button
                          onClick={() => onSelectCategoryFilter(cat.category)}
                          className="rounded p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title={`Filter ledger by ${cat.category}`}
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, cat.percentage)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-cyan-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Channels
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Outflow distribution across instruments
            </p>
          </div>

          <div className="space-y-3">
            {paymentMethodData.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No payment data recorded.</p>
            ) : (
              paymentMethodData.map((item) => (
                <div key={item.method} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.method}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({item.count} txns)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
