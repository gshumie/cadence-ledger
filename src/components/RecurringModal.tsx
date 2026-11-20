'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  RecurringTransaction,
  RecurringFrequency,
  TransactionType,
  Category,
  PaymentMethod,
} from '@/types/finance';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/formatters';
import { X, Check, Repeat } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  editRecurring?: RecurringTransaction | null;
}

export function RecurringModal({ isOpen, onClose, editRecurring }: RecurringModalProps) {
  const { addRecurring, updateRecurring, currencySymbol } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editRecurring) {
      setType(editRecurring.type);
      setTitle(editRecurring.title);
      setAmount(editRecurring.amount.toString());
      setCategory(editRecurring.category);
      setPaymentMethod(editRecurring.paymentMethod);
      setFrequency(editRecurring.frequency);
      setNextDate(editRecurring.nextDate);
      setIsActive(editRecurring.isActive);
      setNotes(editRecurring.notes || '');
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setPaymentMethod('Credit Card');
      setFrequency('monthly');
      setNextDate(new Date().toISOString().split('T')[0]);
      setIsActive(true);
      setNotes('');
    }
    setError('');
    setIsSubmitting(false);
  }, [editRecurring, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!title.trim()) {
      setError('Please provide a title or subscription name.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(`Please enter a valid amount greater than ${currencySymbol}0.`);
      return;
    }
    if (!nextDate) {
      setError('Please select a valid next billing date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editRecurring) {
        await updateRecurring(editRecurring.id, {
          title: title.trim(),
          amount: parsedAmount,
          type,
          category,
          paymentMethod,
          frequency,
          nextDate,
          isActive,
          notes: notes.trim() || undefined,
        });
      } else {
        await addRecurring({
          title: title.trim(),
          amount: parsedAmount,
          type,
          category,
          paymentMethod,
          frequency,
          nextDate,
          isActive,
          notes: notes.trim() || undefined,
        });

        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      onClose();
    } catch {
      setError('An error occurred while saving the recurring rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Repeat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editRecurring ? 'Edit Recurring Rule' : 'New Recurring Rule / Subscription'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editRecurring
                  ? 'Update schedule, amount, or frequency'
                  : 'Automate predictable recurring income and bills'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Transaction Type Segmented Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs dark:bg-slate-900 dark:text-rose-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Recurring Bill / Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Recurring Income / Salary
            </button>
          </div>

          {/* Title / Subscription Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subscription or Payee Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Luxury Apartment Rent, Fiber Internet, Tech Salary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount ({currencySymbol})
              </label>
              <div className="relative mt-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Billing Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="weekly">Weekly (Every 7 Days)</option>
                <option value="monthly">Monthly (Every Month)</option>
                <option value="yearly">Yearly (Annual Renewal)</option>
              </select>
            </div>
          </div>

          {/* Next Due Date & Payment Method */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Next Occurrence / Due Date
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Digital Wallet / UPI">Digital Wallet / UPI</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Rule Status: {isActive ? 'Active (Auto-Tracking)' : 'Paused'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isActive
                  ? 'Appears in upcoming alerts and can be logged on schedule'
                  : 'Temporarily disabled from alerts and dashboard badges'}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden dark:bg-slate-700"></div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Subscription plan, account number, cancellation renewal term"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : editRecurring ? 'Update Rule' : 'Save Recurring Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
