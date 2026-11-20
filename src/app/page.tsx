'use client';

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from '@/context/FinanceContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { InsightsBanner } from '@/components/InsightsBanner';
import { CashFlowChart } from '@/components/Charts/CashFlowChart';
import { CategoryDonutChart } from '@/components/Charts/CategoryDonutChart';
import { BudgetBarChart } from '@/components/Charts/BudgetBarChart';
import { BudgetManager } from '@/components/BudgetManager';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { BudgetModal } from '@/components/BudgetModal';
import { AuthModal } from '@/components/AuthModal';
import { AnalyticsView } from '@/components/AnalyticsView';
import { RecurringManager } from '@/components/RecurringManager';
import { RecurringModal } from '@/components/RecurringModal';
import { Transaction, RecurringTransaction } from '@/types/finance';
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  ShieldCheck,
  PieChart as PieIcon,
  Repeat,
} from 'lucide-react';

function DashboardContent() {
  const { isLoaded, setFilters, upcomingBills } = useFinance();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ledger' | 'budgets' | 'recurring'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setIsRecurringModalOpen(true);
  };

  const handleOpenEditRecurring = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setIsRecurringModalOpen(true);
  };

  const handleSelectCategoryFilter = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
    setActiveTab('ledger');
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading Cadence Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 transition-colors duration-200 dark:bg-[#070b14] dark:text-slate-100">
      {/* Top Navigation */}
      <Header
        onOpenAddModal={handleOpenAddModal}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Insights & Limit Warning Banner */}
        <InsightsBanner
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          onNavigateToRecurring={() => setActiveTab('recurring')}
        />

        {/* Top Summary Metrics */}
        <SummaryCards />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PieIcon className="h-4 w-4" />
              <span>Analytics & Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === 'ledger'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Transactions Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === 'budgets'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Budgets & Goals</span>
            </button>

            <button
              onClick={() => setActiveTab('recurring')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === 'recurring'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Repeat className="h-4 w-4" />
              <span>Recurring & Bills</span>
              {upcomingBills.length > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {upcomingBills.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Interactive Charts: Cash Flow & Spending Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CashFlowChart />
              <CategoryDonutChart />
            </div>

            {/* Budget vs Actual Comparison */}
            <BudgetBarChart />

            {/* Budget Overview Widget */}
            <BudgetManager onOpenBudgetModal={() => setIsBudgetModalOpen(true)} />

            {/* Transactions Section */}
            <TransactionTable
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView onSelectCategoryFilter={handleSelectCategoryFilter} />
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <TransactionTable
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
            />
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <BudgetManager onOpenBudgetModal={() => setIsBudgetModalOpen(true)} />
            <BudgetBarChart />
          </div>
        )}

        {activeTab === 'recurring' && (
          <div className="space-y-6">
            <RecurringManager
              onOpenAddModal={handleOpenAddRecurring}
              onOpenEditModal={handleOpenEditRecurring}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Cadence Ledger • Private, Client-Side Encrypted & Fast</span>
          </div>
          <p>
            Built with Next.js App Router, Tailwind CSS, Recharts & Lucide Icons • Ready for Vercel
          </p>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
        editRecurring={editingRecurring}
      />

      <AuthModal />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <DashboardContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
