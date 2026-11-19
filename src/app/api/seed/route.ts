import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { INITIAL_BUDGETS, INITIAL_TRANSACTIONS } from '@/utils/initialData';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Database not configured; seed is stored locally in session',
      });
    }

    // Delete existing records for this user
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.budget.deleteMany({ where: { userId: user.id } });

    // Seed transactions
    await prisma.transaction.createMany({
      data: INITIAL_TRANSACTIONS.map((tx) => ({
        userId: user.id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        paymentMethod: tx.paymentMethod,
        notes: tx.notes || null,
      })),
    });

    // Seed budgets
    await prisma.budget.createMany({
      data: INITIAL_BUDGETS.map((b) => ({
        userId: user.id,
        category: b.category,
        limit: b.limit,
        period: b.period,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${INITIAL_TRANSACTIONS.length} transactions and ${INITIAL_BUDGETS.length} budgets into PostgreSQL for user ${user.email}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
