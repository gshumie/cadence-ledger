'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw, Home, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected errors safely to client console
    console.error('Unhandled Cadence Ledger application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 transition-colors dark:bg-[#070b14] sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <AlertOctagon className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Something went wrong
        </h2>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          An unexpected issue interrupted your session. Your data is securely saved in PostgreSQL.
        </p>

        {error?.digest && (
          <div className="mt-3 rounded-lg bg-slate-100 p-2 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Reference code: {error.digest}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => {
              window.location.reload();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Page</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-transparent px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
