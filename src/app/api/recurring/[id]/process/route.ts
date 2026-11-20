import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { advanceNextDate } from '@/utils/recurring';
import {
  Transaction,
  RecurringTransaction,
  TransactionType,
  Category,
  PaymentMethod,
  RecurringFrequency,
} from '@/types/finance';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Database is not configured for processing transactions.',
      }, { status: 503 });
    }

    // 1. Find the recurring transaction rule for this authenticated user
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!recurring) {
      return NextResponse.json(
        { success: false, error: 'Recurring transaction rule not found or unauthorized.' },
        { status: 404 }
      );
    }

    // 2. Determine transaction date (use recurring.nextDate, or today if nextDate is missing)
    const txDate = recurring.nextDate || new Date().toISOString().split('T')[0];
    const logNote = recurring.notes
      ? `${recurring.notes} [Auto-logged recurring rule]`
      : 'Auto-logged recurring rule';

    // 3. Create the real Transaction in PostgreSQL
    const createdTx = await prisma.transaction.create({
      data: {
        userId: user.id,
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        paymentMethod: recurring.paymentMethod,
        date: txDate,
        notes: logNote,
      },
    });

    // 4. Advance nextDate to next cycle
    const nextCycleDate = advanceNextDate(txDate, recurring.frequency);

    // 5. Update recurring transaction record
    const updatedRecurring = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        nextDate: nextCycleDate,
      },
    });

    const formattedTx: Transaction = {
      id: createdTx.id,
      title: createdTx.title,
      amount: createdTx.amount,
      type: createdTx.type as TransactionType,
      category: createdTx.category as Category,
      paymentMethod: createdTx.paymentMethod as PaymentMethod,
      date: createdTx.date,
      notes: createdTx.notes || undefined,
      createdAt: createdTx.createdAt.toISOString(),
    };

    const formattedRecurring: RecurringTransaction = {
      id: updatedRecurring.id,
      userId: updatedRecurring.userId,
      title: updatedRecurring.title,
      amount: updatedRecurring.amount,
      type: updatedRecurring.type as TransactionType,
      category: updatedRecurring.category as Category,
      paymentMethod: updatedRecurring.paymentMethod as PaymentMethod,
      frequency: updatedRecurring.frequency as RecurringFrequency,
      nextDate: updatedRecurring.nextDate,
      isActive: updatedRecurring.isActive,
      notes: updatedRecurring.notes || undefined,
      createdAt: updatedRecurring.createdAt.toISOString(),
      updatedAt: updatedRecurring.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Successfully logged "${recurring.title}" and advanced next date to ${nextCycleDate}`,
      transaction: formattedTx,
      recurring: formattedRecurring,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process recurring transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
