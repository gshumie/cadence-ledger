'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Transaction,
  RecurringTransaction,
  BudgetLimit,
  CategoryBudgetStatus,
  FinancialSummary,
  MonthlyChartData,
  CategorySpendingData,
  TransactionFilters,
  ExpenseCategory,
  Currency,
} from '@/types/finance';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_BUDGETS, INITIAL_TRANSACTIONS, INITIAL_RECURRING } from '@/utils/initialData';
import { getBillDueStatus, DueStatus } from '@/utils/recurring';
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

export type UpcomingBillItem = RecurringTransaction & { dueStatus: DueStatus };

interface FinanceContextType {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  upcomingBills: UpcomingBillItem[];
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
  isDemoUser: boolean;
  
  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateRecurring: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  toggleRecurringActive: (id: string, isActive: boolean) => Promise<void>;
  processRecurringNow: (id: string) => Promise<{ success: boolean; message?: string }>;
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
  const { accessToken, user: authUser, isDemoUser } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>(INITIAL_BUDGETS);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected' | 'connection_error'>('disconnected');
  const [currentUser, setCurrentUser] = useState<UserSession>({
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
  });
  const [currency, setCurrencyState] = useState<Currency>('USD');

  // Sync currentUser with AuthContext user
  useEffect(() => {
    setCurrentUser({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
    });
  }, [authUser]);

  // Authenticated fetch helper attaching Supabase JWT token if available
  const authFetch = useCallback(
    (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers || {});
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return fetch(url, {
        ...init,
        headers,
      });
    },
    [accessToken]
  );

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
      const authRes = await authFetch('/api/auth/me');
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
      const txRes = await authFetch('/api/transactions?month=all');
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
      const budgetRes = await authFetch('/api/budgets');
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

      // 4. Fetch recurring transactions from API
      const recRes = await authFetch('/api/recurring');
      if (recRes.ok) {
        const recJson = await recRes.json();
        if (Array.isArray(recJson.data)) {
          setRecurringTransactions(recJson.data);
          try {
            localStorage.setItem('cadence_recurring_cache', JSON.stringify(recJson.data));
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
      try {
        const cachedRec = localStorage.getItem('cadence_recurring_cache');
        if (cachedRec) setRecurringTransactions(JSON.parse(cachedRec));
        else setRecurringTransactions(INITIAL_RECURRING.map((r) => ({ ...r, userId: authUser.id })));
      } catch {
        setRecurringTransactions(INITIAL_RECURRING.map((r) => ({ ...r, userId: authUser.id })));
      }
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, [authFetch, authUser.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData, accessToken, authUser.id]);

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

  // Smart alerts: upcoming bills due within 7 days or overdue
  const upcomingBills = useMemo<UpcomingBillItem[]>(() => {
    return recurringTransactions
      .filter((r) => r.isActive && r.type === 'expense')
      .map((r) => ({
        ...r,
        dueStatus: getBillDueStatus(r.nextDate),
      }))
      .filter(
        (r) =>
          r.dueStatus.status === 'overdue' ||
          r.dueStatus.status === 'today' ||
          r.dueStatus.status === 'due_soon'
      )
      .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  }, [recurringTransactions]);

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
      const res = await authFetch('/api/transactions', {
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
      await authFetch(`/api/transactions/${id}`, {
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
      await authFetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete transaction via API:', err);
    }
  };

  const addRecurring = async (
    data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    const tempId = `rec-temp-${Date.now()}`;
    const optimisticRec: RecurringTransaction = {
      ...data,
      id: tempId,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRecurringTransactions((prev) =>
      [...prev, optimisticRec].sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    );

    try {
      const res = await authFetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setRecurringTransactions((prev) =>
            prev
              .map((r) => (r.id === tempId ? json.data : r))
              .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
          );
        }
      }
    } catch (err) {
      console.error('Failed to create recurring transaction via API:', err);
    }
  };

  const updateRecurring = async (id: string, data: Partial<RecurringTransaction>) => {
    setRecurringTransactions((prev) =>
      prev
        .map((r) => (r.id === id ? { ...r, ...data } : r))
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    );

    try {
      await authFetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to update recurring transaction via API:', err);
    }
  };

  const deleteRecurring = async (id: string) => {
    setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));

    try {
      await authFetch(`/api/recurring/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete recurring transaction via API:', err);
    }
  };

  const toggleRecurringActive = async (id: string, isActive: boolean) => {
    await updateRecurring(id, { isActive });
  };

  const processRecurringNow = async (id: string) => {
    try {
      const res = await authFetch(`/api/recurring/${id}/process`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.transaction) {
          setTransactions((prev) => [json.transaction, ...prev]);
        }
        if (json.recurring) {
          setRecurringTransactions((prev) =>
            prev
              .map((r) => (r.id === id ? json.recurring : r))
              .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
          );
        }
        return { success: true, message: json.message };
      }
      return {
        success: false,
        message: json.error || 'Failed to process recurring transaction',
      };
    } catch (err) {
      console.error('Error processing recurring transaction now:', err);
      return {
        success: false,
        message: 'Network error occurred while processing recurring transaction',
      };
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
      await authFetch('/api/budgets', {
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
      await authFetch('/api/seed', { method: 'POST' });
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
        recurringTransactions,
        upcomingBills,
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
        isDemoUser,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        toggleRecurringActive,
        processRecurringNow,
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
