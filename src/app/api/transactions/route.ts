import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { INITIAL_TRANSACTIONS } from '@/utils/initialData';
import { Transaction, TransactionType, Category, PaymentMethod } from '@/types/finance';
import { ApiResponse, CreateTransactionDTO } from '@/types/api';
import { Prisma } from '@prisma/client';

const VALID_TYPES: TransactionType[] = ['income', 'expense'];
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
    const { searchParams } = new URL(req.url);

    const month = searchParams.get('month'); // 'YYYY-MM' or 'all'
    const type = searchParams.get('type') as TransactionType | 'all' | null;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate');     // YYYY-MM-DD
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : null;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : null;
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder')?.toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    // Validate query parameters
    if (type && type !== 'all' && !VALID_TYPES.includes(type)) {
      const errRes: ApiResponse = {
        success: false,
        error: `Invalid "type" parameter. Must be "income", "expense", or "all". Received: "${type}".`,
      };
      return NextResponse.json(errRes, { status: 400 });
    }

    if (month && month !== 'all' && !/^\d{4}-\d{2}$/.test(month)) {
      const errRes: ApiResponse = {
        success: false,
        error: `Invalid "month" format. Must be "YYYY-MM" or "all". Received: "${month}".`,
      };
      return NextResponse.json(errRes, { status: 400 });
    }

    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      const errRes: ApiResponse = {
        success: false,
        error: `Invalid "startDate" format. Expected "YYYY-MM-DD".`,
      };
      return NextResponse.json(errRes, { status: 400 });
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      const errRes: ApiResponse = {
        success: false,
        error: `Invalid "endDate" format. Expected "YYYY-MM-DD".`,
      };
      return NextResponse.json(errRes, { status: 400 });
    }

    if (isDatabaseConfigured()) {
      try {
        // Auto-seed for new user if no transactions exist in the database
        const count = await prisma.transaction.count({
          where: { userId: user.id },
        });

        if (count === 0) {
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
        }

        // Construct Prisma where query
        const where: Prisma.TransactionWhereInput = {
          userId: user.id,
        };

        // Date / Month range filters
        if (startDate || endDate) {
          where.date = {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          };
        } else if (month && month !== 'all') {
          where.date = { startsWith: month };
        }

        // Type filter
        if (type && type !== 'all') {
          where.type = type;
        }

        // Category filter
        if (category && category !== 'all') {
          where.category = category;
        }

        // Amount range filter
        if (minAmount !== null || maxAmount !== null) {
          where.amount = {
            ...(minAmount !== null && !isNaN(minAmount) ? { gte: minAmount } : {}),
            ...(maxAmount !== null && !isNaN(maxAmount) ? { lte: maxAmount } : {}),
          };
        }

        // Text search filter
        if (search && search.trim()) {
          const q = search.trim();
          where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            { paymentMethod: { contains: q, mode: 'insensitive' } },
          ];
        }

        // Sort configuration
        const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
        if (sortBy === 'amount') {
          orderBy.amount = sortOrder;
        } else if (sortBy === 'title') {
          orderBy.title = sortOrder;
        } else {
          orderBy.date = sortOrder;
        }

        // Pagination
        const take = limit && limit > 0 ? Math.min(limit, 500) : undefined;
        const skip = page && page > 1 && take ? (page - 1) * take : undefined;

        const [totalMatching, transactions] = await Promise.all([
          prisma.transaction.count({ where }),
          prisma.transaction.findMany({
            where,
            orderBy: [orderBy, { createdAt: 'desc' }],
            take,
            skip,
          }),
        ]);

        const formatted: Transaction[] = transactions.map((t) => ({
          id: t.id,
          title: t.title,
          amount: t.amount,
          type: t.type as TransactionType,
          category: t.category as Category,
          date: t.date,
          paymentMethod: t.paymentMethod as PaymentMethod,
          notes: t.notes || undefined,
          createdAt: t.createdAt.toISOString(),
        }));

        const response: ApiResponse<Transaction[]> = {
          success: true,
          source: 'postgresql',
          data: formatted,
          count: totalMatching,
          meta: {
            page: page || 1,
            limit: take || formatted.length,
            totalPages: take ? Math.ceil(totalMatching / take) : 1,
          },
        };

        return NextResponse.json(response, { status: 200 });
      } catch (dbError) {
        console.warn('Prisma transaction query failed, using fallback:', dbError);
      }
    }

    // Local fallback if database is not configured
    let localData = [...INITIAL_TRANSACTIONS];
    if (month && month !== 'all') {
      localData = localData.filter((t) => t.date.startsWith(month));
    }
    if (startDate) {
      localData = localData.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      localData = localData.filter((t) => t.date <= endDate);
    }
    if (type && type !== 'all') {
      localData = localData.filter((t) => t.type === type);
    }
    if (category && category !== 'all') {
      localData = localData.filter((t) => t.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      localData = localData.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        data: localData,
        count: localData.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch transactions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body: Partial<CreateTransactionDTO> = await req.json();

    const { title, amount, type, category, date, paymentMethod, notes } = body;

    // Strict input validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title / Merchant description is required.' },
        { status: 400 }
      );
    }
    if (title.trim().length > 200) {
      return NextResponse.json(
        { success: false, error: 'Title cannot exceed 200 characters.' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json(
        { success: false, error: 'Amount is required and must be a valid numeric value.' },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero.' },
        { status: 400 }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be either "income" or "expense".' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category is required.' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Date is required in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    const validatedMethod: PaymentMethod =
      paymentMethod && VALID_PAYMENT_METHODS.includes(paymentMethod)
        ? paymentMethod
        : 'Bank Transfer';

    if (isDatabaseConfigured()) {
      const created = await prisma.transaction.create({
        data: {
          userId: user.id,
          title: title.trim(),
          amount: Math.round(amount * 100) / 100,
          type,
          category: category.trim(),
          date,
          paymentMethod: validatedMethod,
          notes: notes ? notes.trim() : null,
        },
      });

      const formatted: Transaction = {
        id: created.id,
        title: created.title,
        amount: created.amount,
        type: created.type as TransactionType,
        category: created.category as Category,
        date: created.date,
        paymentMethod: created.paymentMethod as PaymentMethod,
        notes: created.notes || undefined,
        createdAt: created.createdAt.toISOString(),
      };

      const response: ApiResponse<Transaction> = {
        success: true,
        source: 'postgresql',
        data: formatted,
        message: 'Transaction successfully recorded in database.',
      };

      return NextResponse.json(response, { status: 201 });
    }

    // Local in-memory fallback
    const fallbackTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      amount: Math.round(amount * 100) / 100,
      type,
      category: category as Category,
      date,
      paymentMethod: validatedMethod,
      notes: notes ? notes.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        data: fallbackTx,
        message: 'Transaction recorded (demo session).',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
