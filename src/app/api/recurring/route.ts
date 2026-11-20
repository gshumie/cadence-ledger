import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { INITIAL_RECURRING } from '@/utils/initialData';
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

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (isDatabaseConfigured()) {
      try {
        // Auto-seed for this user if no recurring transactions exist yet
        const count = await prisma.recurringTransaction.count({
          where: { userId: user.id },
        });

        if (count === 0) {
          await prisma.recurringTransaction.createMany({
            data: INITIAL_RECURRING.map((rec) => ({
              userId: user.id,
              title: rec.title,
              amount: rec.amount,
              type: rec.type,
              category: rec.category,
              paymentMethod: rec.paymentMethod,
              frequency: rec.frequency,
              nextDate: rec.nextDate,
              isActive: rec.isActive,
              notes: rec.notes || null,
            })),
          });
        }

        const items = await prisma.recurringTransaction.findMany({
          where: { userId: user.id },
          orderBy: { nextDate: 'asc' },
        });

        const formatted: RecurringTransaction[] = items.map((rec) => ({
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
        }));

        return NextResponse.json({
          success: true,
          source: 'postgresql',
          data: formatted,
        });
      } catch (dbErr) {
        console.warn('Database query for recurring transactions failed, falling back:', dbErr);
      }
    }

    // Fallback: return INITIAL_RECURRING
    return NextResponse.json({
      success: true,
      source: 'initial_fallback',
      data: INITIAL_RECURRING.map((rec) => ({
        ...rec,
        userId: user.id,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve recurring transactions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const {
      title,
      amount,
      type,
      category,
      paymentMethod = 'Credit Card',
      frequency = 'monthly',
      nextDate,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'A valid title is required.' },
        { status: 400 }
      );
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number greater than 0.' },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.` },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category is required.' },
        { status: 400 }
      );
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}.` },
        { status: 400 }
      );
    }

    if (!nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
      return NextResponse.json(
        { success: false, error: 'Valid next date (YYYY-MM-DD) is required.' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      const created = await prisma.recurringTransaction.create({
        data: {
          userId: user.id,
          title: title.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          type,
          category: category.trim(),
          paymentMethod: VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'Credit Card',
          frequency,
          nextDate,
          isActive: Boolean(isActive),
          notes: notes && typeof notes === 'string' ? notes.trim() : null,
        },
      });

      const formatted: RecurringTransaction = {
        id: created.id,
        userId: created.userId,
        title: created.title,
        amount: created.amount,
        type: created.type as TransactionType,
        category: created.category as Category,
        paymentMethod: created.paymentMethod as PaymentMethod,
        frequency: created.frequency as RecurringFrequency,
        nextDate: created.nextDate,
        isActive: created.isActive,
        notes: created.notes || undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };

      return NextResponse.json({ success: true, data: formatted }, { status: 201 });
    }

    // Fallback if DB not configured
    const mockCreated: RecurringTransaction = {
      id: `rec-temp-${Date.now()}`,
      userId: user.id,
      title: title.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      type: type as TransactionType,
      category: category as Category,
      paymentMethod: (VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'Credit Card') as PaymentMethod,
      frequency: frequency as RecurringFrequency,
      nextDate,
      isActive: Boolean(isActive),
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: mockCreated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create recurring transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
