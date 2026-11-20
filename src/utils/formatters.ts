import { ExpenseCategory, IncomeCategory, Currency } from '@/types/finance';

export function getCurrencySymbol(currency: Currency = 'USD'): string {
  return currency === 'ETB' ? 'Br' : '$';
}

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === 'ETB') {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}Br ${formatted}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currency: Currency = 'USD'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === 'ETB') {
    const formatted = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(absAmount);
    return `${isNegative ? '-' : ''}Br ${formatted}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercentage(value: number, includeSign: boolean = false): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYear(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export const CATEGORY_COLORS: Record<string, string> = {
  // Expenses
  'Housing & Rent': '#6366f1', // Indigo
  'Food & Groceries': '#f59e0b', // Amber
  'Utilities & Bills': '#06b6d4', // Cyan
  'Transportation': '#3b82f6', // Blue
  'Healthcare': '#ef4444', // Red
  'Entertainment & Leisure': '#ec4899', // Pink
  'Shopping': '#8b5cf6', // Purple
  'Personal Care': '#10b981', // Emerald
  'Education': '#14b8a6', // Teal
  'Travel': '#f97316', // Orange
  'Savings & Investments': '#22c55e', // Green
  'Miscellaneous Expense': '#94a3b8', // Slate

  // Income
  'Salary & Wages': '#10b981',
  'Freelance & Consulting': '#059669',
  'Investments & Dividends': '#0284c7',
  'Rental Income': '#8b5cf6',
  'Gifts & Grants': '#d946ef',
  'Side Hustle': '#14b8a6',
  'Other Income': '#64748b',
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#64748b';
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Housing & Rent',
  'Food & Groceries',
  'Utilities & Bills',
  'Transportation',
  'Healthcare',
  'Entertainment & Leisure',
  'Shopping',
  'Personal Care',
  'Education',
  'Travel',
  'Savings & Investments',
  'Miscellaneous Expense',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary & Wages',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Rental Income',
  'Gifts & Grants',
  'Side Hustle',
  'Other Income',
];
