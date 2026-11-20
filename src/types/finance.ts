export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Housing & Rent'
  | 'Food & Groceries'
  | 'Utilities & Bills'
  | 'Transportation'
  | 'Healthcare'
  | 'Entertainment & Leisure'
  | 'Shopping'
  | 'Personal Care'
  | 'Education'
  | 'Travel'
  | 'Savings & Investments'
  | 'Miscellaneous Expense';

export type IncomeCategory =
  | 'Salary & Wages'
  | 'Freelance & Consulting'
  | 'Investments & Dividends'
  | 'Rental Income'
  | 'Gifts & Grants'
  | 'Side Hustle'
  | 'Other Income';

export type Category = ExpenseCategory | IncomeCategory;

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Cash'
  | 'Digital Wallet / UPI';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface BudgetLimit {
  category: ExpenseCategory;
  limit: number;
  period: 'monthly';
}

export interface CategoryBudgetStatus {
  category: ExpenseCategory;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // in percentage, e.g. 24.5
  incomeGrowth: number; // % delta vs previous month
  expenseGrowth: number; // % delta vs previous month
  savingsGrowth: number;
}

export interface MonthlyChartData {
  month: string;
  yearMonth: string; // YYYY-MM
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpendingData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TransactionFilters {
  searchQuery: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: 'all' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom';
  startDate?: string;
  endDate?: string;
  sortBy: 'date' | 'amount' | 'title';
  sortOrder: 'asc' | 'desc';
}

export type Currency = 'USD' | 'ETB';

export type Theme = 'light' | 'dark' | 'system';
