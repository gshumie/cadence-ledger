'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Transaction,
  BudgetLimit,
  CategoryBudgetStatus,
  FinancialSummary,
  MonthlyChartData,
  CategorySpendingData,
  TransactionFilters,
  ExpenseCategory,
  Currency,
} from '@/types/finance';
import { INITIAL_BUDGETS, INITIAL_TRANSACTIONS } from '@/utils/initialData';
import {
  getCategoryColor,
  formatCurrency as formatCurrencyUtil,
  formatCompactCurrency as formatCompactCurrencyUtil,
  getCurrencySymbol,
} from '@/utils/formatters';

export interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  selectedMonth: string; // 'YYYY-MM' or 'all'
  filters: TransactionFilters;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencySymbol: string;
  formatCurrency: (amount: number, overrideCurrency?: Currency) => string;
  formatCompactCurrency: (amount: number, overrideCurrency?: Currency) => string;
  isLoaded: boolean;
  isSyncing: boolean;
  dbStatus: 'connected' | 'disconnected' | 'connection_error';
  currentUser: UserSession;
  
  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (category: ExpenseCategory, limit: number) => Promise<void>;
  setSelectedMonth: (month: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  resetFilters: () => void;
  resetToSampleData: () => Promise<void>;
  importTransactions: (newTransactions: Partial<Transaction>[]) => Promise<void>;
  refreshData: () => Promise<void>;

  // Computed Values
  filteredTransactions: Transaction[];
  summary: FinancialSummary;
  budgetStatuses: CategoryBudgetStatus[];
  budgetAlerts: CategoryBudgetStatus[];
  monthlyChartData: MonthlyChartData[];
  categorySpendingData: CategorySpendingData[];
  availableMonths: { value: string; label: string }[];
}

const defaultFilters: TransactionFilters = {
  searchQuery: '',
  type: 'all',
  category: 'all',
  dateRange: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>(INITIAL_BUDGETS);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'connection_error'>('disconnected');
  const [currentUser, setCurrentUser] = useState<UserSession>({
    id: 'usr_cadence_default',
    email: 'alex.finance@cadenceledger.io',
    name: 'Alex Mercer',
  });
  const [currency, setCurrencyState] = useState<Currency>('USD');

  // Load currency from localStorage on client mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('cadence_currency');
      if (savedCurrency === 'ETB' || savedCurrency === 'USD') {
        setCurrencyState(savedCurrency);
      }
    } catch {}
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('cadence_currency', newCurrency);
    } catch {}
  }, []);

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  const formatCurrency = useCallback(
    (amount: number, overrideCurrency?: Currency) => {
      return formatCurrencyUtil(amount, overrideCurrency || currency);
    },
    [currency]
  );

  const formatCompactCurrency = useCallback(
    (amount: number, overrideCurrency?: Currency) => {
      return formatCompactCurrencyUtil(amount, overrideCurrency || currency);
    },
    [currency]
  );

  // Fetch initial data from PostgreSQL Backend API
  const refreshData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch user & database status
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.user) {
          setCurrentUser(authData.user);
        }
        if (authData.database?.status) {
          setDbStatus(authData.database.status);
        }
      }

      // 2. Fetch transactions from API
      const txRes = await fetch('/api/transactions?month=all');
      if (txRes.ok) {
        const txJson = await txRes.json();
        if (Array.isArray(txJson.data)) {
          setTransactions(txJson.data);
          try {
            localStorage.setItem('cadence_transactions_cache', JSON.stringify(txJson.data));
          } catch {}
        }
      }

      // 3. Fetch budgets from API
      const budgetRes = await fetch('/api/budgets');
      if (budgetRes.ok) {
        const budgetJson = await budgetRes.json();
        const rawBudgets = Array.isArray(budgetJson.data)
          ? budgetJson.data
          : budgetJson.data?.budgets;
        if (Array.isArray(rawBudgets)) {
          const formattedBudgets: BudgetLimit[] = rawBudgets.map((b: BudgetLimit) => ({
            category: b.category,
            limit: b.limit,
            period: b.period || 'monthly',
          }));
          setBudgets(formattedBudgets);
          try {
            localStorage.setItem('cadence_budgets_cache', JSON.stringify(formattedBudgets));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('API fetch encountered an error, falling back to cached/initial data:', err);
      // Fallback cache
      try {
        const cachedTx = localStorage.getItem('cadence_transactions_cache');
        if (cachedTx) setTransactions(JSON.parse(cachedTx));
        else setTransactions(INITIAL_TRANSACTIONS);
      } catch {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Extract unique available months sorted descending
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        monthSet.add(tx.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    monthSet.add('2026-11');
    const sorted = Array.from(monthSet).sort().reverse();
    return [
      { value: 'all', label: 'All Time' },
      ...sorted.map((m) => {
        const [year, month] = m.split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
        return { value: m, label };
      }),
    ];
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (selectedMonth !== 'all') {
      result = result.filter((tx) => tx.date.startsWith(selectedMonth));
    }

    if (filters.type !== 'all') {
      result = result.filter((tx) => tx.type === filters.type);
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter((tx) => tx.category === filters.category);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.title.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q)) ||
          tx.paymentMethod.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comp = 0;
      if (filters.sortBy === 'date') {
        comp = new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (filters.sortBy === 'amount') {
        comp = b.amount - a.amount;
      } else if (filters.sortBy === 'title') {
        comp = a.title.localeCompare(b.title);
      }
      return filters.sortOrder === 'asc' ? -comp : comp;
    });

    return result;
  }, [transactions, selectedMonth, filters]);

  // Compute summary metrics
  const summary = useMemo<FinancialSummary>(() => {
    const currentPeriodTxs = selectedMonth === 'all'
      ? transactions
      : transactions.filter((tx) => tx.date.startsWith(selectedMonth));

    const totalIncome = currentPeriodTxs
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = currentPeriodTxs
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

    const allTimeBalance = transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    let incomeGrowth = 0;
    let expenseGrowth = 0;
    let savingsGrowth = 0;

    if (selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      const prevTxs = transactions.filter((tx) => tx.date.startsWith(prevYearMonth));

      const prevIncome = prevTxs
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const prevExpenses = prevTxs
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      const prevNet = prevIncome - prevExpenses;

      if (prevIncome > 0) incomeGrowth = ((totalIncome - prevIncome) / prevIncome) * 100;
      if (prevExpenses > 0) expenseGrowth = ((totalExpenses - prevExpenses) / prevExpenses) * 100;
      if (prevNet !== 0) savingsGrowth = ((netSavings - prevNet) / Math.abs(prevNet)) * 100;
    }

    return {
      totalBalance: selectedMonth === 'all' ? allTimeBalance : netSavings,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      incomeGrowth,
      expenseGrowth,
      savingsGrowth,
    };
  }, [transactions, selectedMonth]);

  // Compute budget statuses
  const budgetStatuses = useMemo<CategoryBudgetStatus[]>(() => {
    const targetMonth = selectedMonth === 'all' ? '2026-11' : selectedMonth;
    const monthlyExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(targetMonth)
    );

    const categoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach((tx) => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    return budgets.map((b) => {
      const spent = categoryTotals[b.category] || 0;
      const remaining = Math.max(0, b.limit - spent);
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      return {
        category: b.category,
        limit: b.limit,
        spent,
        remaining,
        percentage,
        isWarning: percentage >= 75 && percentage < 100,
        isExceeded: percentage >= 100,
      };
    });
  }, [transactions, budgets, selectedMonth]);

  const budgetAlerts = useMemo(() => {
    return budgetStatuses.filter((b) => b.isWarning || b.isExceeded);
  }, [budgetStatuses]);

  // Monthly Chart Data
  const monthlyChartData = useMemo<MonthlyChartData[]>(() => {
    const monthMap: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((tx) => {
      const ym = tx.date.substring(0, 7);
      if (!monthMap[ym]) {
        monthMap[ym] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        monthMap[ym].income += tx.amount;
      } else {
        monthMap[ym].expenses += tx.amount;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort();
    return sortedMonths.map((ym) => {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
      const inc = monthMap[ym].income;
      const exp = monthMap[ym].expenses;
      return {
        month: monthLabel,
        yearMonth: ym,
        income: Math.round(inc * 100) / 100,
        expenses: Math.round(exp * 100) / 100,
        net: Math.round((inc - exp) * 100) / 100,
      };
    });
  }, [transactions]);

  // Category spending breakdown for Donut Chart
  const categorySpendingData = useMemo<CategorySpendingData[]>(() => {
    const targetTxs = selectedMonth === 'all'
      ? transactions.filter((t) => t.type === 'expense')
      : transactions.filter((t) => t.type === 'expense' && t.date.startsWith(selectedMonth));

    const catMap: Record<string, number> = {};
    let totalExpense = 0;

    targetTxs.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    });

    return Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
        color: getCategoryColor(category),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth]);

  // Actions wired to API Routes
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tempId = `tx-temp-${Date.now()}`;
    const optimisticTx: Transaction = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setTransactions((prev) => [optimisticTx, ...prev]);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          // Replace optimistic record with canonical database record
          setTransactions((prev) =>
            prev.map((t) => (t.id === tempId ? json.data : t))
          );
        }
      }
    } catch (err) {
      console.error('Failed to persist transaction to API:', err);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    // Optimistic update
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...data } : tx))
    );

    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to update transaction via API:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    // Optimistic delete
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete transaction via API:', err);
    }
  };

  const updateBudget = async (category: ExpenseCategory, limit: number) => {
    // Optimistic update
    setBudgets((prev) => {
      const exists = prev.some((b) => b.category === category);
      if (exists) {
        return prev.map((b) => (b.category === category ? { ...b, limit } : b));
      }
      return [...prev, { category, limit, period: 'monthly' }];
    });

    try {
      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, limit, period: 'monthly' }),
      });
    } catch (err) {
      console.error('Failed to persist budget to API:', err);
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const resetToSampleData = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await refreshData();
    } catch (err) {
      console.error('Failed to reset sample data via API:', err);
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
    } finally {
      setIsSyncing(false);
    }
  };

  const importTransactions = async (newTransactions: Partial<Transaction>[]) => {
    setIsSyncing(true);
    try {
      for (const tx of newTransactions) {
        await addTransaction({
          title: tx.title || 'Imported Transaction',
          amount: tx.amount || 0,
          type: tx.type || 'expense',
          category: tx.category || 'Miscellaneous Expense',
          date: tx.date || new Date().toISOString().split('T')[0],
          paymentMethod: tx.paymentMethod || 'Bank Transfer',
          notes: tx.notes || 'CSV Import',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        selectedMonth,
        filters,
        currency,
        setCurrency,
        currencySymbol,
        formatCurrency,
        formatCompactCurrency,
        isLoaded,
        isSyncing,
        dbStatus,
        currentUser,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudget,
        setSelectedMonth,
        setFilters,
        resetFilters,
        resetToSampleData,
        importTransactions,
        refreshData,
        filteredTransactions,
        summary,
        budgetStatuses,
        budgetAlerts,
        monthlyChartData,
        categorySpendingData,
        availableMonths,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
