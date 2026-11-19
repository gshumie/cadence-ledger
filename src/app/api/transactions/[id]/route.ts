import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { Transaction, TransactionType, Category, PaymentMethod } from '@/types/finance';
import { ApiResponse, UpdateTransactionDTO } from '@/types/api';
import { Prisma } from '@prisma/client';

const VALID_TYPES: TransactionType[] = ['income', 'expense'];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid transaction ID is required.' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      const transaction = await prisma.transaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found or you do not have permission to view it.' },
          { status: 404 }
        );
      }

      const formatted: Transaction = {
        id: transaction.id,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type as TransactionType,
        category: transaction.category as Category,
        date: transaction.date,
        paymentMethod: transaction.paymentMethod as PaymentMethod,
        notes: transaction.notes || undefined,
        createdAt: transaction.createdAt.toISOString(),
      };

      const response: ApiResponse<Transaction> = {
        success: true,
        source: 'postgresql',
        data: formatted,
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Database not configured in this environment.' },
      { status: 404 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve transaction';
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
    const body: UpdateTransactionDTO = await req.json();

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid transaction ID is required.' },
        { status: 400 }
      );
    }

    // Input validations for fields present in body
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty.' },
          { status: 400 }
        );
      }
    }

    if (body.amount !== undefined) {
      const parsedAmount = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Amount must be a positive number greater than 0.' },
          { status: 400 }
        );
      }
    }

    if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be either "income" or "expense".' },
        { status: 400 }
      );
    }

    if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { success: false, error: 'Date must be formatted as YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      // Verify ownership
      const existing = await prisma.transaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found or you do not have permission to modify it.' },
          { status: 404 }
        );
      }

      const updatePayload: Prisma.TransactionUpdateInput = {};
      if (body.title !== undefined) updatePayload.title = body.title.trim();
      if (body.amount !== undefined) updatePayload.amount = Math.round(Number(body.amount) * 100) / 100;
      if (body.type !== undefined) updatePayload.type = body.type;
      if (body.category !== undefined) updatePayload.category = body.category.trim();
      if (body.date !== undefined) updatePayload.date = body.date;
      if (body.paymentMethod !== undefined) updatePayload.paymentMethod = body.paymentMethod;
      if (body.notes !== undefined) updatePayload.notes = body.notes ? body.notes.trim() : null;

      const updated = await prisma.transaction.update({
        where: { id },
        data: updatePayload,
      });

      const formatted: Transaction = {
        id: updated.id,
        title: updated.title,
        amount: updated.amount,
        type: updated.type as TransactionType,
        category: updated.category as Category,
        date: updated.date,
        paymentMethod: updated.paymentMethod as PaymentMethod,
        notes: updated.notes || undefined,
        createdAt: updated.createdAt.toISOString(),
      };

      const response: ApiResponse<Transaction> = {
        success: true,
        source: 'postgresql',
        data: formatted,
        message: 'Transaction successfully updated.',
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Local fallback
    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        data: { id, ...body },
        message: 'Transaction updated (local session).',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update transaction';
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

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid transaction ID is required.' },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      const existing = await prisma.transaction.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found or you do not have permission to delete it.' },
          { status: 404 }
        );
      }

      await prisma.transaction.delete({
        where: { id },
      });

      const response: ApiResponse = {
        success: true,
        source: 'postgresql',
        message: 'Transaction successfully deleted from database.',
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      {
        success: true,
        source: 'local_fallback',
        message: 'Transaction removed from session.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete transaction';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
