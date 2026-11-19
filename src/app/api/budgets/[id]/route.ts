import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { ApiResponse, BudgetStatusItem, UpdateBudgetDTO } from '@/types/api';
import { ExpenseCategory } from '@/types/finance';
import { Prisma } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '2026-11';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Budget ID is required.' }, { status: 400 });
    }

    if (isDatabaseConfigured()) {
      const budget = await prisma.budget.findFirst({
        where: { id, userId: user.id },
      });

      if (!budget) {
        return NextResponse.json(
          { success: false, error: 'Budget not found or unauthorized.' },
          { status: 404 }
        );
      }

      // Calculate spent for target month
      const expenseTxs = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          category: budget.category,
          type: 'expense',
          date: { startsWith: month },
        },
        select: { amount: true },
      });

      const spent = Math.round(expenseTxs.reduce((acc, t) => acc + t.amount, 0) * 100) / 100;
      const remaining = Math.round(Math.max(0, budget.limit - spent) * 100) / 100;
      const percentage = budget.limit > 0 ? Math.round((spent / budget.limit) * 1000) / 10 : 0;

      const item: BudgetStatusItem = {
        id: budget.id,
        category: budget.category as ExpenseCategory,
        limit: budget.limit,
        spent,
        remaining,
        percentage,
        isWarning: percentage >= 75 && percentage < 100,
        isExceeded: percentage >= 100,
        period: budget.period,
      };

      const response: ApiResponse<BudgetStatusItem> = {
        success: true,
        source: 'postgresql',
        data: item,
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Database not configured.' },
      { status: 404 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve budget';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function handleUpdate(
  req: Request,
  params: Promise<{ id: string }>
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;
    const body: UpdateBudgetDTO = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Budget ID is required.' }, { status: 400 });
    }

    if (body.limit !== undefined) {
      if (typeof body.limit !== 'number' || isNaN(body.limit) || body.limit < 0) {
        return NextResponse.json(
          { success: false, error: 'Limit must be a valid non-negative number.' },
          { status: 400 }
        );
      }
    }

    if (isDatabaseConfigured()) {
      const existing = await prisma.budget.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Budget not found or unauthorized.' },
          { status: 404 }
        );
      }

      const updatePayload: Prisma.BudgetUpdateInput = {};
      if (body.limit !== undefined) updatePayload.limit = Math.round(body.limit * 100) / 100;
      if (body.period !== undefined) updatePayload.period = body.period;

      const updated = await prisma.budget.update({
        where: { id },
        data: updatePayload,
      });

      const response: ApiResponse = {
        success: true,
        source: 'postgresql',
        data: {
          id: updated.id,
          category: updated.category,
          limit: updated.limit,
          period: updated.period,
        },
        message: 'Budget successfully updated.',
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { success: true, source: 'local_fallback', data: { id, ...body } },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update budget';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, props.params);
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, props.params);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Budget ID is required.' }, { status: 400 });
    }

    if (isDatabaseConfigured()) {
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

      const response: ApiResponse = {
        success: true,
        source: 'postgresql',
        message: 'Budget successfully deleted.',
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
