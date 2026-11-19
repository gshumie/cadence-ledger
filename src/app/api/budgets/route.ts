import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { INITIAL_BUDGETS } from '@/utils/initialData';
import { ExpenseCategory } from '@/types/finance';
import {
  ApiResponse,
  CreateBudgetDTO,
  BudgetsResponseData,
  BudgetStatusItem,
} from '@/types/api';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const month = searchParams.get('month') || '2026-11';
    const categoryParam = searchParams.get('category');

    if (month !== 'all' && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format. Expected "YYYY-MM" or "all".' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      try {
        // Auto-seed initial budgets for new users
        const count = await prisma.budget.count({
          where: { userId: user.id },
        });

        if (count === 0) {
          await prisma.budget.createMany({
            data: INITIAL_BUDGETS.map((b) => ({
              userId: user.id,
              category: b.category,
              limit: b.limit,
              period: b.period,
            })),
          });
        }

        // Query budgets for this user
        const budgetWhere: Prisma.BudgetWhereInput = { userId: user.id };
        if (categoryParam && categoryParam !== 'all') {
          budgetWhere.category = categoryParam;
        }

        const budgets = await prisma.budget.findMany({
          where: budgetWhere,
          orderBy: { category: 'asc' },
        });

        // Query expenses for the target month to compute actual spent
        const txWhere: Prisma.TransactionWhereInput = {
          userId: user.id,
          type: 'expense',
        };
        if (month !== 'all') {
          txWhere.date = { startsWith: month };
        }

        const monthlyExpenseTxs = await prisma.transaction.findMany({
          where: txWhere,
          select: { category: true, amount: true },
        });

        // Aggregate actual spending per category
        const categorySpendingMap: Record<string, number> = {};
        monthlyExpenseTxs.forEach((tx) => {
          categorySpendingMap[tx.category] =
            (categorySpendingMap[tx.category] || 0) + tx.amount;
        });

        // Calculate accurate spent-vs-remaining metrics
        let totalBudget = 0;
        let totalSpent = 0;
        let exceededCount = 0;
        let warningCount = 0;

        const budgetItems: BudgetStatusItem[] = budgets.map((b) => {
          const spent = Math.round((categorySpendingMap[b.category] || 0) * 100) / 100;
          const remaining = Math.round(Math.max(0, b.limit - spent) * 100) / 100;
          const percentage = b.limit > 0 ? Math.round((spent / b.limit) * 1000) / 10 : 0;
          const isWarning = percentage >= 75 && percentage < 100;
          const isExceeded = percentage >= 100;

          totalBudget += b.limit;
          totalSpent += spent;
          if (isExceeded) exceededCount++;
          else if (isWarning) warningCount++;

          return {
            id: b.id,
            category: b.category as ExpenseCategory,
            limit: b.limit,
            spent,
            remaining,
            percentage,
            isWarning,
            isExceeded,
            period: b.period,
          };
        });

        const totalRemaining = Math.round(Math.max(0, totalBudget - totalSpent) * 100) / 100;
        const utilizationRate =
          totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

        const responseData: BudgetsResponseData = {
          budgets: budgetItems,
          overall: {
            totalBudget: Math.round(totalBudget * 100) / 100,
            totalSpent: Math.round(totalSpent * 100) / 100,
            totalRemaining,
            utilizationRate,
            exceededCount,
            warningCount,
          },
          month,
        };

        const response: ApiResponse<BudgetsResponseData> = {
          success: true,
          source: 'postgresql',
          data: responseData,
          count: budgetItems.length,
        };

        return NextResponse.json(response, { status: 200 });
      } catch (dbError) {
        console.warn('Prisma budget fetch failed, using fallback:', dbError);
      }
    }

    // Local fallback
    const fallbackItems: BudgetStatusItem[] = INITIAL_BUDGETS.map((b, idx) => ({
      id: `bgt-fallback-${idx}`,
      category: b.category,
      limit: b.limit,
      spent: 0,
      remaining: b.limit,
      percentage: 0,
      isWarning: false,
      isExceeded: false,
      period: b.period,
    }));

    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        data: {
          budgets: fallbackItems,
          overall: {
            totalBudget: fallbackItems.reduce((acc, b) => acc + b.limit, 0),
            totalSpent: 0,
            totalRemaining: fallbackItems.reduce((acc, b) => acc + b.limit, 0),
            utilizationRate: 0,
            exceededCount: 0,
            warningCount: 0,
          },
          month,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch budgets';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body: Partial<CreateBudgetDTO> = await req.json();

    const { category, limit, period = 'monthly' } = body;

    // Validation
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required.' },
        { status: 400 }
      );
    }

    if (limit === undefined || limit === null || typeof limit !== 'number' || isNaN(limit)) {
      return NextResponse.json(
        { success: false, error: 'Limit must be a valid numeric amount.' },
        { status: 400 }
      );
    }

    if (limit < 0) {
      return NextResponse.json(
        { success: false, error: 'Limit cannot be negative.' },
        { status: 400 }
      );
    }

    const cleanCategory = category.trim() as ExpenseCategory;
    const roundedLimit = Math.round(limit * 100) / 100;

    if (isDatabaseConfigured()) {
      const budget = await prisma.budget.upsert({
        where: {
          userId_category: {
            userId: user.id,
            category: cleanCategory,
          },
        },
        update: {
          limit: roundedLimit,
          period: period || 'monthly',
        },
        create: {
          userId: user.id,
          category: cleanCategory,
          limit: roundedLimit,
          period: period || 'monthly',
        },
      });

      const response: ApiResponse = {
        success: true,
        source: 'postgresql',
        data: {
          id: budget.id,
          category: budget.category,
          limit: budget.limit,
          period: budget.period,
        },
        message: `Budget for "${cleanCategory}" successfully updated to $${budget.limit}.`,
      };

      return NextResponse.json(response, { status: 201 });
    }

    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        data: { category: cleanCategory, limit: roundedLimit, period },
        message: 'Budget saved (local session).',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update budget';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category');
    const id = searchParams.get('id');

    if (!category && !id) {
      return NextResponse.json(
        { success: false, error: 'Either "category" or "id" query parameter is required to delete a budget.' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      let deletedCount = 0;
      if (id) {
        const existing = await prisma.budget.findFirst({
          where: { id, userId: user.id },
        });
        if (!existing) {
          return NextResponse.json(
            { success: false, error: 'Budget not found or unauthorized.' },
            { status: 404 }
          );
        }
        await prisma.budget.delete({ where: { id } });
        deletedCount = 1;
      } else if (category) {
        const res = await prisma.budget.deleteMany({
          where: { userId: user.id, category },
        });
        deletedCount = res.count;
      }

      if (deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'No matching budget found to delete.' },
          { status: 404 }
        );
      }

      const response: ApiResponse = {
        success: true,
        source: 'postgresql',
        message: 'Budget limit successfully removed.',
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { success: true, source: 'local_fallback', message: 'Budget removed from local session.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete budget';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
