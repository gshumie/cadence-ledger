'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatters';
import { PieChart as PieIcon } from 'lucide-react';

interface CustomTooltipEntry {
  payload: {
    category: string;
    amount: number;
    percentage: number;
  };
}

function CategoryDonutCustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CustomTooltipEntry[];
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{data.category}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(data.amount)}
          </span>
          <span className="text-slate-400">({data.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
}

export function CategoryDonutChart() {
  const { categorySpendingData, summary } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const activeCategory = activeIndex !== null ? categorySpendingData[activeIndex] : null;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-purple-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Spending Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Expenses grouped by category
          </p>
        </div>
      </div>

      {categorySpendingData.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-xs text-slate-400">
          No expense records in this timeframe.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          {/* Chart with center text */}
          <div className="relative h-64 sm:col-span-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CategoryDonutCustomTooltip />} />
                <Pie
                  data={categorySpendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="amount"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categorySpendingData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={activeIndex === index ? 3 : 1}
                      stroke={activeIndex === index ? '#ffffff' : 'transparent'}
                      className="cursor-pointer transition-all duration-200"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {activeCategory ? activeCategory.category : 'Total Outflow'}
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(activeCategory ? activeCategory.amount : summary.totalExpenses)}
              </span>
              {activeCategory && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {activeCategory.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1 sm:col-span-6">
            {categorySpendingData.slice(0, 6).map((item, idx) => (
              <div
                key={item.category}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex cursor-pointer items-center justify-between rounded-lg p-1.5 transition-colors ${
                  activeIndex === idx
                    ? 'bg-slate-100 dark:bg-slate-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="w-9 text-right text-[11px] text-slate-400">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
