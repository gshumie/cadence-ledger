import React from 'react';
import { Wallet } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/70 p-4 transition-colors dark:bg-[#070b14]">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Animated Brand Logo */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25">
          <Wallet className="h-7 w-7 animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-ping opacity-25" />
        </div>

        {/* Brand Text & Spinner */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Cadence Ledger
            </span>
            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              Syncing
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Establishing secure PostgreSQL session...
          </p>
        </div>

        {/* Shimmer Progress Indicator */}
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-full animate-indeterminate rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
        </div>
      </div>
    </div>
  );
}
