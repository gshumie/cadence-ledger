import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDashboardSummary } from '@/lib/summary';
import { isDatabaseConfigured } from '@/lib/prisma';
import { ApiResponse, DashboardSummaryData } from '@/types/api';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const month = searchParams.get('month') || '2026-11';

    // Validation: month must be 'all' or 'YYYY-MM'
    if (month !== 'all' && !/^\d{4}-\d{2}$/.test(month)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Invalid month format. Expected "YYYY-MM" or "all" (e.g., "2026-11").',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const summaryData = await getDashboardSummary(user.id, month);

    const response: ApiResponse<DashboardSummaryData> = {
      success: true,
      source: isDatabaseConfigured() ? 'postgresql' : 'local_fallback',
      data: summaryData,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compute dashboard summary';
    const errorResponse: ApiResponse = {
      success: false,
      error: message,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
