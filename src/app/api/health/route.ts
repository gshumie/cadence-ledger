import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET() {
  const startTime = Date.now();
  let dbStatus: 'connected' | 'disconnected' | 'demo_mode' = 'disconnected';
  let latencyMs = 0;
  let isHealthy = true;

  if (isDatabaseConfigured()) {
    try {
      // Light non-blocking ping query
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - startTime;
      dbStatus = 'connected';
    } catch (err) {
      console.warn('Database health check ping failed:', err);
      dbStatus = 'disconnected';
      isHealthy = false;
    }
  } else {
    dbStatus = 'demo_mode';
  }

  const responseBody = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'cadence-ledger',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    database: {
      status: dbStatus,
      latencyMs,
      provider: 'postgresql',
    },
    features: {
      multiUserAuth: true,
      recurringTransactions: true,
      dualCurrency: true,
      offlineFallback: true,
    },
  };

  return NextResponse.json(responseBody, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}
