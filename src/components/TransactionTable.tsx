'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, TransactionFilters } from '@/types/finance';
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/utils/formatters';
import { exportTransactionsToCSV } from '@/utils/exportImport';
import {
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  CreditCard,
  Download,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface TransactionTableProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (tx: Transaction) => void;
}

export function TransactionTable({ onOpenAddModal, onOpenEditModal }: TransactionTableProps) {
  const {
    transactions,
    filteredTransactions,
    filters,
    setFilters,
    deleteTransaction,
    resetFilters,
    selectedMonth,
  } = useFinance();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sorting handlers
  const handleSort = (field: 'date' | 'amount' | 'title') => {
    if (filters.sortBy === field) {
      setFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: 'desc',
      }));
    }
    setCurrentPage(1);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}"?`)) {
      deleteTransaction(id);
    }
  };

  // Combine unique categories from data and constants
  const allCategories = useMemo(() => {
    const fromData = transactions.map((t) => t.category);
    return Array.from(new Set([...fromData, ...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));
  }, [transactions]);

  // Counts by type within current month/timeframe
  const typeCounts = useMemo(() => {
    const base = selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.date.startsWith(selectedMonth));

    const incomeCount = base.filter((t) => t.type === 'income').length;
    const expenseCount = base.filter((t) => t.type === 'expense').length;
    return {
      all: base.length,
      income: incomeCount,
      expense: expenseCount,
    };
  }, [transactions, selectedMonth]);

  // CSV Export handler for filtered transactions
  const handleExportFiltered = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions match the current filters to export.');
      return;
    }

    const typeDesc = filters.type !== 'all' ? `_${filters.type}` : '';
    const catDesc = filters.category !== 'all' ? `_${filters.category.replace(/\s+/g, '_')}` : '';
    const dateDesc = selectedMonth !== 'all' ? `_${selectedMonth}` : '_all_time';
    const filename = `cadence_ledger${typeDesc}${catDesc}${dateDesc}.csv`;

    exportTransactionsToCSV(filteredTransactions, filename);
  };

  // Active filters check
  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange !== 'all' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Title & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Transactions Ledger
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {filteredTransactions.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time querying, multi-criteria filtering, and CSV data export
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Filtered CSV Button */}
          <button
            onClick={handleExportFiltered}
            title="Download CSV of current filtered results"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV ({filteredTransactions.length})</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, amount, category..."
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs text-slate-800 transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Type Filter Tabs with Counts */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            {(['all', 'income', 'expense'] as const).map((t) => {
              const count = typeCounts[t];
              return (
                <button
                  key={t}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, type: t }));
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filters.type === t
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>{t}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      filters.type === t
                        ? 'bg-indigo-700/80 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, category: e.target.value }));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date / Month Preset Selector */}
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => {
                const val = e.target.value as TransactionFilters['dateRange'];
                setFilters((prev) => ({ ...prev, dateRange: val }));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">Date Range: All</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* Toggle Advanced Date Range Picker */}
          <button
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
              showAdvancedFilters || filters.dateRange === 'custom'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title="Toggle Custom Date Range Pickers"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Date Picker</span>
          </button>
        </div>

        {/* Custom Date Range Inputs (expandable) */}
        {(showAdvancedFilters || filters.dateRange === 'custom') && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 transition-all dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>Custom Date Range:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">From:</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: 'custom',
                    startDate: e.target.value,
                  }));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-500">To:</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: 'custom',
                    endDate: e.target.value,
                  }));
                  setCurrentPage(1);
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            {(filters.startDate || filters.endDate) && (
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: undefined,
                    endDate: undefined,
                    dateRange: 'all',
                  }))
                }
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active filters:</span>

            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Search: &ldquo;{filters.searchQuery}&rdquo;
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  className="hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.type !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Type: {filters.type}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
                  className="hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.category !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Category: {filters.category}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, category: 'all' }))}
                  className="hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Range: {filters.dateRange}
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, dateRange: 'all', startDate: undefined, endDate: undefined }))}
                  className="hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 underline hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <RotateCcw className="h-3 w-3" />
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="cursor-pointer px-4 py-3 hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date</span>
                  {filters.sortBy === 'date' && (
                    filters.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="cursor-pointer px-4 py-3 hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Merchant / Title</span>
                  {filters.sortBy === 'title' && (
                    filters.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3">Category</th>
              <th className="hidden px-4 py-3 sm:table-cell">Method</th>
              <th
                onClick={() => handleSort('amount')}
                className="cursor-pointer px-4 py-3 text-right hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  {filters.sortBy === 'amount' && (
                    filters.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="mt-1 text-xs">Try adjusting your filters, search keywords, or date range.</p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                    >
                      Clear active filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const catColor = getCategoryColor(tx.category);

                return (
                  <tr
                    key={tx.id}
                    className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>

                    {/* Title & Notes */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.title}
                      </div>
                      {tx.notes && (
                        <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: `${catColor}15`,
                          color: catColor,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: catColor }}
                        />
                        {tx.category}
                      </span>
                    </td>

                    {/* Method */}
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400 sm:table-cell">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium dark:bg-slate-800 dark:text-slate-300">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenEditModal(tx)}
                          title="Edit transaction"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.title)}
                          title="Delete transaction"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredTransactions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
            </span>
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
