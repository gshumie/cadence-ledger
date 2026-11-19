import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { DashboardSummaryData, CategoryBreakdownItem } from '@/types/api';
import { MonthlyChartData } from '@/types/finance';
import { INITIAL_TRANSACTIONS } from '@/utils/initialData';
import { getCategoryColor } from '@/utils/formatters';

export async function getDashboardSummary(
  userId: string,
  targetMonth: string = '2026-11'
): Promise<DashboardSummaryData> {
  const isAllTime = targetMonth === 'all';

  if (isDatabaseConfigured()) {
    try {
      // 1. Fetch all transactions for this user
      const allTransactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      });

      // All-time balance
      const totalBalance = allTransactions.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
      }, 0);

      // Filter for target month
      const currentPeriodTxs = isAllTime
        ? allTransactions
        : allTransactions.filter((t) => t.date.startsWith(targetMonth));

      const monthlyIncome = currentPeriodTxs
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const monthlyExpenses = currentPeriodTxs
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      const netSavings = monthlyIncome - monthlyExpenses;
      const savingsRate = monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;

      // Previous month comparison
      let incomeGrowth = 0;
      let expenseGrowth = 0;
      let savingsGrowth = 0;
      let prevIncome = 0;
      let prevExpenses = 0;
      let prevNet = 0;

      if (!isAllTime) {
        const [yearStr, monthStr] = targetMonth.split('-');
        const year = parseInt(yearStr, 10);
        const monthNum = parseInt(monthStr, 10);
        const prevDate = new Date(year, monthNum - 2, 1);
        const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        const prevTxs = allTransactions.filter((t) => t.date.startsWith(prevYearMonth));
        prevIncome = prevTxs
          .filter((t) => t.type === 'income')
          .reduce((acc, t) => acc + t.amount, 0);

        prevExpenses = prevTxs
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => acc + t.amount, 0);

        prevNet = prevIncome - prevExpenses;

        if (prevIncome > 0) {
          incomeGrowth = ((monthlyIncome - prevIncome) / prevIncome) * 100;
        }
        if (prevExpenses > 0) {
          expenseGrowth = ((monthlyExpenses - prevExpenses) / prevExpenses) * 100;
        }
        if (prevNet !== 0) {
          savingsGrowth = ((netSavings - prevNet) / Math.abs(prevNet)) * 100;
        }
      }

      // Category breakdown
      const expenseTxs = currentPeriodTxs.filter((t) => t.type === 'expense');
      const catMap: Record<string, { amount: number; count: number }> = {};

      expenseTxs.forEach((t) => {
        if (!catMap[t.category]) {
          catMap[t.category] = { amount: 0, count: 0 };
        }
        catMap[t.category].amount += t.amount;
        catMap[t.category].count += 1;
      });

      const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(catMap)
        .map(([category, { amount, count }]) => ({
          category,
          amount: Math.round(amount * 100) / 100,
          percentage:
            monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 1000) / 10 : 0,
          color: getCategoryColor(category),
          count,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Monthly Trend (aggregated by month for the user)
      const monthMap: Record<string, { income: number; expenses: number }> = {};
      allTransactions.forEach((t) => {
        const ym = t.date.substring(0, 7);
        if (!monthMap[ym]) {
          monthMap[ym] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
          monthMap[ym].income += t.amount;
        } else {
          monthMap[ym].expenses += t.amount;
        }
      });

      const sortedMonths = Object.keys(monthMap).sort();
      const monthlyTrend: MonthlyChartData[] = sortedMonths.map((ym) => {
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

      // Budget status summary
      const budgets = await prisma.budget.findMany({ where: { userId } });
      let totalBudget = 0;
      let totalSpent = 0;
      let exceededCount = 0;
      let warningCount = 0;

      budgets.forEach((b) => {
        totalBudget += b.limit;
        const spent = catMap[b.category]?.amount || 0;
        totalSpent += spent;
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        if (pct >= 100) exceededCount++;
        else if (pct >= 75) warningCount++;
      });

      const totalRemaining = Math.max(0, totalBudget - totalSpent);
      const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Savings health status
      let savingsHealth: 'Superb' | 'Healthy' | 'Moderate' | 'Attention' = 'Attention';
      if (savingsRate >= 30) savingsHealth = 'Superb';
      else if (savingsRate >= 20) savingsHealth = 'Healthy';
      else if (savingsRate >= 10) savingsHealth = 'Moderate';

      return {
        month: targetMonth,
        totalBalance: Math.round(totalBalance * 100) / 100,
        monthlyIncome: Math.round(monthlyIncome * 100) / 100,
        monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate: Math.round(savingsRate * 10) / 10,
        savingsHealth,
        comparison: {
          incomeGrowth: Math.round(incomeGrowth * 10) / 10,
          expenseGrowth: Math.round(expenseGrowth * 10) / 10,
          savingsGrowth: Math.round(savingsGrowth * 10) / 10,
          prevIncome: Math.round(prevIncome * 100) / 100,
          prevExpenses: Math.round(prevExpenses * 100) / 100,
          prevNet: Math.round(prevNet * 100) / 100,
        },
        categoryBreakdown,
        monthlyTrend,
        budgetSummary: {
          totalBudget: Math.round(totalBudget * 100) / 100,
          totalSpent: Math.round(totalSpent * 100) / 100,
          totalRemaining: Math.round(totalRemaining * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 10) / 10,
          exceededCount,
          warningCount,
        },
      };
    } catch (dbError) {
      console.warn('Prisma summary calculation failed, using fallback:', dbError);
    }
  }

  // Fallback calculation using initial data
  const txs = isAllTime
    ? INITIAL_TRANSACTIONS
    : INITIAL_TRANSACTIONS.filter((t) => t.date.startsWith(targetMonth));

  const monthlyIncome = txs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpenses = txs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

  return {
    month: targetMonth,
    totalBalance: netSavings,
    monthlyIncome,
    monthlyExpenses,
    netSavings,
    savingsRate,
    savingsHealth: savingsRate >= 20 ? 'Healthy' : 'Moderate',
    comparison: {
      incomeGrowth: 0,
      expenseGrowth: 0,
      savingsGrowth: 0,
      prevIncome: 0,
      prevExpenses: 0,
      prevNet: 0,
    },
    categoryBreakdown: [],
    monthlyTrend: [],
    budgetSummary: {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      utilizationRate: 0,
      exceededCount: 0,
      warningCount: 0,
    },
  };
}
