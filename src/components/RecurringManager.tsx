'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { RecurringTransaction } from '@/types/finance';
import { getCategoryColor, formatDate } from '@/utils/formatters';
import { getBillDueStatus } from '@/utils/recurring';
import {
  Repeat,
  Plus,
  Zap,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecurringManagerProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (recurring: RecurringTransaction) => void;
}

export function RecurringManager({ onOpenAddModal, onOpenEditModal }: RecurringManagerProps) {
  const {
    recurringTransactions,
    deleteRecurring,
    toggleRecurringActive,
    processRecurringNow,
    formatCurrency,
  } = useFinance();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute monthly normalized totals
  const metrics = useMemo(() => {
    let monthlyExpenses = 0;
    let monthlyIncome = 0;
    let activeCount = 0;
    let upcomingDueCount = 0;
    let upcomingDueTotal = 0;

    recurringTransactions.forEach((item) => {
      if (!item.isActive) return;
      activeCount++;

      // Monthly equivalent multiplier
      const multiplier = item.frequency === 'weekly' ? 4.333 : item.frequency === 'yearly' ? 1 / 12 : 1;
      const monthlyAmount = item.amount * multiplier;

      if (item.type === 'expense') {
        monthlyExpenses += monthlyAmount;
        const dueStatus = getBillDueStatus(item.nextDate);
        if (dueStatus.status === 'overdue' || dueStatus.status === 'today' || dueStatus.status === 'due_soon') {
          upcomingDueCount++;
          upcomingDueTotal += item.amount;
        }
      } else {
        monthlyIncome += monthlyAmount;
      }
    });

    return {
      monthlyExpenses,
      monthlyIncome,
      activeCount,
      upcomingDueCount,
      upcomingDueTotal,
    };
  }, [recurringTransactions]);

  // Filtered recurring list
  const filteredItems = useMemo(() => {
    return recurringTransactions.filter((item) => {
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'paused' && item.isActive) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [recurringTransactions, statusFilter, typeFilter, searchQuery]);

  // Handle Log Now action
  const handleLogNow = async (item: RecurringTransaction) => {
    setProcessingId(item.id);
    try {
      const result = await processRecurringNow(item.id);
      if (result.success) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
        setToastMessage(`Logged "${item.title}" for ${formatCurrency(item.amount)}! Next date updated.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(result.message || 'Failed to process recurring transaction.');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the recurring rule for "${title}"?`)) {
      await deleteRecurring(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fixed Monthly Outflow */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Fixed Outflow
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(metrics.monthlyExpenses)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Combined subscriptions & bills / month
          </p>
        </div>

        {/* Predictable Monthly Inflow */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recurring Inflow
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(metrics.monthlyIncome)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Salaries & recurring contracts / month
          </p>
        </div>

        {/* Due Next 7 Days Alert */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs transition-colors dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Due Within 7 Days
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
            {formatCurrency(metrics.upcomingDueTotal)}
          </div>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 font-medium">
            {metrics.upcomingDueCount} {metrics.upcomingDueCount === 1 ? 'bill' : 'bills'} due or overdue
          </p>
        </div>

        {/* Active Rules Count */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Schedules
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Repeat className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.activeCount}{' '}
            <span className="text-xs font-normal text-slate-400">/ {recurringTransactions.length} rules</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {recurringTransactions.length - metrics.activeCount} paused rules
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900">
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="h-4 w-4 text-indigo-500" />
              <span>Recurring Rules & Subscriptions</span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Automate repetitive bills, track upcoming due dates, and post records with one-click Log Now
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Add Recurring Rule</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setStatusFilter('paused')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === 'paused'
                    ? 'bg-white text-slate-600 shadow-xs dark:bg-slate-900 dark:text-slate-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Paused
              </button>
            </div>

            {/* Type Pills */}
            <div className="flex items-center rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                onClick={() => setTypeFilter('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  typeFilter === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs dark:bg-slate-900 dark:text-rose-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Bills
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  typeFilter === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Incomes
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs sm:w-auto">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter recurring rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Recurring List */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Repeat className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No Recurring Rules Found
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Automate your monthly subscriptions, apartment rent, internet, and salary schedules.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Rule</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => {
              const due = getBillDueStatus(item.nextDate);
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                    !item.isActive ? 'opacity-60 bg-slate-50/30 dark:bg-slate-950/20' : ''
                  }`}
                >
                  {/* Left: Info & Badges */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                      title={item.category}
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </span>

                        {/* Frequency Badge */}
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.frequency}
                        </span>

                        {/* Due Badge (if expense and active) */}
                        {item.isActive && item.type === 'expense' && (
                          <span
                            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              due.status === 'overdue'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                : due.status === 'today'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : due.status === 'due_soon'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {due.status === 'overdue' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span>{due.label}</span>
                          </span>
                        )}

                        {/* Paused Badge */}
                        {!item.isActive && (
                          <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Paused
                          </span>
                        )}
                      </div>

                      {/* Subtitle / Details */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.paymentMethod}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Next: {formatDate(item.nextDate)}</span>
                        </span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic max-w-xs truncate">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    {/* Amount */}
                    <div className="text-right">
                      <div
                        className={`text-base font-bold tracking-tight ${
                          item.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400">per {item.frequency.replace('ly', '')}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* One-Click Log Now */}
                      <button
                        onClick={() => handleLogNow(item)}
                        disabled={isProcessing}
                        title={`Log this ${item.type} into your active ledger now and advance the date`}
                        className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                      >
                        <Zap className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>{isProcessing ? 'Logging...' : 'Log Now'}</span>
                      </button>

                      {/* Active Toggle Switch */}
                      <button
                        onClick={() => toggleRecurringActive(item.id, !item.isActive)}
                        className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                          item.isActive
                            ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400'
                        }`}
                        title={item.isActive ? 'Pause recurring alerts' : 'Activate recurring alerts'}
                      >
                        {item.isActive ? 'Pause' : 'Activate'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onOpenEditModal(item)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Edit rule"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        title="Delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
