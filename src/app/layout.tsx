import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://cadence-ledger.vercel.app'),
  title: {
    default: 'Cadence Ledger | Modern Personal Finance & Expense Tracker',
    template: '%s | Cadence Ledger',
  },
  description:
    'A private, client-side encrypted personal finance and expense tracking dashboard built with Next.js, Tailwind CSS, Recharts, and Supabase PostgreSQL.',
  keywords: [
    'personal finance',
    'expense tracker',
    'budget planner',
    'cash flow',
    'recurring bills',
    'smart alerts',
    'cadence ledger',
    'supabase postgresql',
    'prisma',
  ],
  authors: [{ name: 'Cadence Ledger Team' }],
  creator: 'Cadence Ledger',
  openGraph: {
    title: 'Cadence Ledger | Modern Personal Finance & Expense Tracker',
    description:
      'Real-time cash flow analytics, monthly category budgets, recurring subscriptions, and multi-user authentication with Supabase PostgreSQL.',
    url: 'https://cadence-ledger.vercel.app',
    siteName: 'Cadence Ledger',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cadence Ledger | Modern Personal Finance & Expense Tracker',
    description:
      'Real-time cash flow analytics, monthly category budgets, recurring subscriptions, and smart alerts.',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cadence Ledger',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
  ],
  width: 'device-width',
  initialScale: 1,
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
