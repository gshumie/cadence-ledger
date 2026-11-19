import {
  TransactionType,
  Category,
  ExpenseCategory,
  PaymentMethod,
  MonthlyChartData,
} from './finance';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  source?: 'postgresql' | 'local_fallback';
  meta?: Record<string, unknown>;
}

export interface CreateTransactionDTO {
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UpdateTransactionDTO {
  title?: string;
  amount?: number;
  type?: TransactionType;
  category?: Category;
  date?: string;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export interface CreateBudgetDTO {
  category: ExpenseCategory;
  limit: number;
  period?: 'monthly';
}

export interface UpdateBudgetDTO {
  limit: number;
  period?: 'monthly';
}

export interface BudgetStatusItem {
  id: string;
  category: ExpenseCategory;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  period: string;
}

export interface BudgetsResponseData {
  budgets: BudgetStatusItem[];
  overall: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    utilizationRate: number;
    exceededCount: number;
    warningCount: number;
  };
  month: string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

export interface DashboardSummaryData {
  month: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  savingsHealth: 'Superb' | 'Healthy' | 'Moderate' | 'Attention';
  comparison: {
    incomeGrowth: number;
    expenseGrowth: number;
    savingsGrowth: number;
    prevIncome: number;
    prevExpenses: number;
    prevNet: number;
  };
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrend: MonthlyChartData[];
  budgetSummary: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    utilizationRate: number;
    exceededCount: number;
    warningCount: number;
  };
}
