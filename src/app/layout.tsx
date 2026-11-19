import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cadence Ledger | Modern Personal Finance & Expense Tracker',
  description:
    'A sleek, responsive, and full-featured personal finance and expense tracking dashboard built with Next.js, Tailwind CSS, and Recharts.',
  keywords: ['personal finance', 'expense tracker', 'budget planner', 'cash flow', 'cadence ledger'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 dark:bg-[#070b14] dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
