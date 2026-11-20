'use client';

import React, { useRef, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/components/ThemeProvider';
import { exportTransactionsToCSV, parseCSVToTransactions } from '@/utils/exportImport';
import {
  Wallet,
  Sun,
  Moon,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Calendar,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenBudgetModal: () => void;
}

export function Header({ onOpenAddModal, onOpenBudgetModal }: HeaderProps) {
  const {
    transactions,
    filteredTransactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    resetToSampleData,
    importTransactions,
    dbStatus,
    isSyncing,
    currentUser,
    refreshData,
    currency,
    setCurrency,
  } = useFinance();
  const { resolvedTheme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDbInfo, setShowDbInfo] = useState(false);

  const handleExport = () => {
    const dataToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const dateLabel = selectedMonth !== 'all' ? selectedMonth : 'all_time';
    exportTransactionsToCSV(dataToExport, `cadence_transactions_${dateLabel}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSVToTransactions(text);
        if (parsed.length > 0) {
          await importTransactions(parsed);
          alert(`Successfully imported ${parsed.length} transactions!`);
        } else {
          alert('Could not parse any valid transactions from the uploaded CSV file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand / Logo & DB Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Cadence
              </span>
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                Ledger
              </span>

              {/* Database Status Indicator */}
              <div className="relative">
                <button
                  onClick={() => setShowDbInfo((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                    dbStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : dbStatus === 'connection_error'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                  title="Click for Database & Supabase connection info"
                >
                  <Database className="h-3 w-3" />
                  <span>
                    {dbStatus === 'connected'
                      ? 'Supabase DB'
                      : dbStatus === 'connection_error'
                      ? 'DB Error'
                      : 'Demo / Offline'}
                  </span>
                </button>

                {/* Popover explaining Database / Supabase setup */}
                {showDbInfo && (
                  <div className="absolute left-0 top-7 z-50 w-72 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Database & Auth Status
                      </span>
                      <button
                        onClick={() => setShowDbInfo(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>Database:</span>
                        <span className="font-semibold capitalize text-slate-900 dark:text-white">
                          {dbStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>User:</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {currentUser.email}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                        To connect your live Supabase database, set <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">DATABASE_URL</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> and run <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">npx prisma db push</code>.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{currentUser.name}</span>
              <button
                onClick={() => refreshData()}
                disabled={isSyncing}
                title="Sync with database"
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-indigo-500' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month Selector */}
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenBudgetModal}
              title="Manage Budgets"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline">Budgets</span>
            </button>

            <button
              onClick={handleExport}
              title="Export Transactions to CSV"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden lg:inline">Export</span>
            </button>

            <button
              onClick={handleImportClick}
              title="Import Transactions from CSV"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden lg:inline">Import</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={resetToSampleData}
              title="Reset to Sample Data & Seed DB"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-rose-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Seed Demo</span>
            </button>

            {/* Currency Selector (USD / ETB) */}
            <div
              className="flex h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              title="Select display currency"
            >
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  currency === 'USD'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="US Dollar ($)"
              >
                <span>$</span>
                <span className="hidden sm:inline">USD</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('ETB')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  currency === 'ETB'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Ethiopian Birr (Br / ETB)"
              >
                <span>Br</span>
                <span className="hidden sm:inline">ETB</span>
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Primary Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
