import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    let dbStatus = 'disconnected';

    if (isDatabaseConfigured()) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch {
        dbStatus = 'connection_error';
      }
    }

    return NextResponse.json({
      success: true,
      user,
      database: {
        status: dbStatus,
        isConfigured: isDatabaseConfigured(),
      },
      supabase: {
        isConfigured: isSupabaseConfigured(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
