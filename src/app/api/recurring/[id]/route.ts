import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  RecurringTransaction,
  RecurringFrequency,
  TransactionType,
  Category,
  PaymentMethod,
} from '@/types/finance';

const VALID_TYPES: TransactionType[] = ['income', 'expense'];
const VALID_FREQUENCIES: RecurringFrequency[] = ['weekly', 'monthly', 'yearly'];
const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Cash',
  'Digital Wallet / UPI',
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (isDatabaseConfigured()) {
      const rec = await prisma.recurringTransaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!rec) {
        return NextResponse.json(
          { success: false, error: 'Recurring transaction not found' },
          { status: 404 }
        );
      }

      const formatted: RecurringTransaction = {
        id: rec.id,
        userId: rec.userId,
        title: rec.title,
        amount: rec.amount,
        type: rec.type as TransactionType,
        category: rec.category as Category,
        paymentMethod: rec.paymentMethod as PaymentMethod,
        frequency: rec.frequency as RecurringFrequency,
        nextDate: rec.nextDate,
        isActive: rec.isActive,
        notes: rec.notes || undefined,
        createdAt: rec.createdAt.toISOString(),
        updatedAt: rec.updatedAt.toISOString(),
      };

      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve recurring transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json({ success: false, error: 'Title cannot be empty.' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.amount !== undefined) {
      const parsedAmount = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Amount must be a positive number.' }, { status: 400 });
      }
      updateData.amount = Math.round(parsedAmount * 100) / 100;
    }

    if (body.type !== undefined) {
      if (!VALID_TYPES.includes(body.type)) {
        return NextResponse.json({ success: false, error: 'Invalid transaction type.' }, { status: 400 });
      }
      updateData.type = body.type;
    }

    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || !body.category.trim()) {
        return NextResponse.json({ success: false, error: 'Category cannot be empty.' }, { status: 400 });
      }
      updateData.category = body.category.trim();
    }

    if (body.paymentMethod !== undefined) {
      if (VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
        updateData.paymentMethod = body.paymentMethod;
      }
    }

    if (body.frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(body.frequency)) {
        return NextResponse.json({ success: false, error: 'Invalid frequency.' }, { status: 400 });
      }
      updateData.frequency = body.frequency;
    }

    if (body.nextDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.nextDate)) {
        return NextResponse.json({ success: false, error: 'Invalid nextDate format (YYYY-MM-DD).' }, { status: 400 });
      }
      updateData.nextDate = body.nextDate;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes).trim() : null;
    }

    if (isDatabaseConfigured()) {
      const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Recurring transaction not found or access denied.' },
          { status: 404 }
        );
      }

      const updated = await prisma.recurringTransaction.update({
        where: { id },
        data: updateData,
      });

      const formatted: RecurringTransaction = {
        id: updated.id,
        userId: updated.userId,
        title: updated.title,
        amount: updated.amount,
        type: updated.type as TransactionType,
        category: updated.category as Category,
        paymentMethod: updated.paymentMethod as PaymentMethod,
        frequency: updated.frequency as RecurringFrequency,
        nextDate: updated.nextDate,
        isActive: updated.isActive,
        notes: updated.notes || undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      return NextResponse.json({ success: true, data: formatted });
    }

    return NextResponse.json({ success: true, data: { id, ...updateData } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update recurring transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (isDatabaseConfigured()) {
      const existing = await prisma.recurringTransaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Recurring transaction not found or access denied.' },
          { status: 404 }
        );
      }

      await prisma.recurringTransaction.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Recurring transaction deleted successfully',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recurring transaction deleted (demo mode)',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete recurring transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
