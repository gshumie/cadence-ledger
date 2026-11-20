'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    signIn,
    signUp,
    switchToDemo,
    isSupabaseEnabled,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (authModalTab === 'signin') {
        const result = await signIn(email, password);
        if (!result.success) {
          setErrorMsg(result.error || 'Failed to sign in.');
        } else {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        }
      } else {
        const result = await signUp(email, password, name);
        if (!result.success) {
          setErrorMsg(result.error || 'Failed to create account.');
        } else {
          setSuccessMsg(result.message || 'Account created successfully!');
          if (!result.message?.includes('confirmation email')) {
            setTimeout(() => {
              closeAuthModal();
            }, 1000);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueDemo = () => {
    switchToDemo();
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cadence Ledger Account
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Private & secure personal finance tracking
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="mt-4 flex rounded-xl border border-slate-200 p-1 dark:border-slate-800 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              authModalTab === 'signin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalTab('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
              authModalTab === 'signup'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Info or error banners */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isSupabaseEnabled && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            Supabase client keys are currently in demo configuration. You can explore all features freely using Demo Mode.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {authModalTab === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </span>
            ) : authModalTab === 'signin' ? (
              <span className="flex items-center gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In to Cadence</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create Private Account</span>
              </span>
            )}
          </button>
        </form>

        {/* Demo Mode Fallback / Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-slate-400">
            Want to test without registering?
          </p>
          <button
            type="button"
            onClick={handleContinueDemo}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Continue in Demo Mode (Alex Mercer)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
