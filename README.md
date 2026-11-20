# Cadence Ledger — Modern Personal Finance & Expense Tracker

<div align="center">

[![Live Deployment](https://img.shields.io/badge/Production-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel)](https://cadence-ledger.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://cadence-ledger.vercel.app/manifest.webmanifest)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A private, client-side encrypted, full-featured personal finance tracker and cash-flow analytics application.**  
Built with Next.js 16 App Router, TypeScript, Tailwind CSS, Prisma 6, Supabase PostgreSQL, and Recharts.

[🚀 **Explore Live Application**](https://cadence-ledger.vercel.app) • [📖 **API Health Check**](https://cadence-ledger.vercel.app/api/health) • [📱 **PWA Manifest**](https://cadence-ledger.vercel.app/manifest.webmanifest)

</div>

---

## 📸 Application Showcase

### 1. Dashboard Overview & Smart Insights
Real-time financial summary cards calculating Net Savings, Monthly Income, Total Expenses, and Savings Rate with period-over-period growth indicators, interactive smart alert banners, and visual cash flow dynamics.

![Dashboard Overview](public/screenshots/dashboard-overview.png)

---

### 2. Multi-Currency Support (Ethiopian Birr `Br ETB` & US Dollar `$ USD`)
Dynamic one-click currency toggling between **ETB (`Br`)** and **USD (`$`)**. Currency formatting cascades through all summary cards, charts, budget bars, transactions ledger, and modal inputs, with local storage persistence.

![Ethiopian Birr Ledger](public/screenshots/currency-etb-ledger.png)

---

### 3. Recurring Transactions & Smart Due Alerts
Automate recurring subscriptions and predictable income cycles (weekly, monthly, yearly). Track upcoming due dates with automatic month-end rollover protection, proactive smart alert banners, and a one-click **"Log Now"** ledger action.

![Recurring Bills](public/screenshots/recurring-bills.png)

---

### 4. Budgets & Predictive Analytics
Category-based spending caps with real-time burn-rate progress bars, threshold status badges (**On Track**, **Near Limit** at 75%+, **Over Budget** at 100%+), and comparative Budget vs. Actual dual-bar charts.

![Budgets & Analytics](public/screenshots/budgets-analytics.png)

---

## ✨ Core Features & Highlights

- **📊 Financial Health Summary**:
  - Live metric cards: Total Balance, Monthly Income, Total Expenses, and Net Savings Rate.
  - Automatic month-over-month percentage delta calculations.
- **📈 Interactive Visualizations (Recharts)**:
  - **Cash Flow Dynamics**: Dual-curve area chart tracking income vs. burn-rate trends across months.
  - **Spending Distribution**: Interactive donut chart with categorized hover tooltips and colored legends.
  - **Budget vs. Actual**: Comparative dual-bar chart visualizing planned limits against real spending.
- **🔄 Recurring Cash Flow Engine**:
  - Support for **Weekly**, **Monthly**, and **Yearly** recurrence rules.
  - **One-Click "Log Now"**: Posts an immutable `Transaction` record into PostgreSQL and auto-advances the `nextDate` to the next cycle.
  - Normalized KPI metrics: Monthly Fixed Outflow, Recurring Inflow, and Active Rules count.
- **🔔 Proactive Smart Alerts**:
  - Highlights upcoming bills due within 7 days (or overdue) with one-click navigation to review and log.
  - Dynamic category over-budget alerts with instant threshold adjustment modals.
- **🇪🇹 Dual Currency Engine**:
  - Seamless toggle between **US Dollar ($)** and **Ethiopian Birr (Br ETB)**.
  - Formats monetary values with proper locale conventions (`Br 1,234.50` vs `$1,234.50`) without corrupting raw database decimals.
- **🔐 Multi-User Authentication & Demo Mode**:
  - Supabase Auth integration with secure JWT bearer authentication.
  - Instant **Demo Mode** (`usr_cadence_default`) for immediate feature evaluation without mandatory sign-up.
  - Strict user-scoped database isolation across all Prisma models.
- **💳 Comprehensive Transactions Ledger**:
  - Instant full-text search across titles, merchants, categories, and notes.
  - Filtering by transaction type (**All**, **Income**, **Expense**), category, and date range preset.
  - Multi-column sorting (Date, Amount, Merchant).
  - Add, edit, and delete transactions with instant UI updates and celebratory confetti.
  - RFC-4180 compliant CSV export and external statement parser/import.
- **📱 Progressive Web App (PWA)**:
  - Valid web app manifest (`/manifest.webmanifest`) for Android Chrome & iOS Safari.
  - Standalone full-screen launch mode with high-resolution adaptive and maskable icons.
- **🛡️ Production Hardened & Resilient**:
  - Enterprise security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).
  - Next.js App Router global error boundary (`error.tsx`) and smooth suspense loading skeleton (`loading.tsx`).
  - Dedicated service and database connectivity health check (`/api/health`).
- **🌓 Dark & Light Mode**: Tailored dark (`#070b14`) and light slate palettes with system preference detection.

---

## 🛠️ Full-Stack Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Turbopack, React 19, Server & Route Handlers |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict typing, zero-tolerance TypeScript compliance |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Modern CSS engine with `@tailwindcss/turbopack` |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Managed cloud PostgreSQL with dual connection pooling |
| **ORM** | [Prisma ORM 6](https://www.prisma.io/) | Type-safe client, relation modeling & migrations |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) | JWT Bearer verification + Client session management |
| **Charts** | [Recharts 3](https://recharts.org/) | Responsive SVG data visualization engine |
| **Icons & FX** | [Lucide React](https://lucide.dev/), [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti) | Clean iconography and UI micro-interactions |
| **Deployment** | [Vercel](https://vercel.com/) | Global Edge network, SSL auto-provisioning, CI/CD |

---

## 🗄️ Database Architecture & Connection Pooling

Supabase utilizes connection poolers (Supavisor / PgBouncer) to handle serverless connections efficiently. Cadence Ledger is configured with a dual connection pooler architecture:

1. **`DATABASE_URL` (Port 6543 — Transaction Mode)**:
   - Configured with `?pgbouncer=true`.
   - Used for all runtime queries in serverless Next.js API routes to handle ephemeral connection spikes without exhausting database connection limits.
2. **`DIRECT_URL` (Port 5432 — Session Mode)**:
   - Direct session pooler connection.
   - Required by Prisma for migrations and schema synchronization (`npx prisma db push`), as DDL statements and advisory locks cannot run in transaction mode.

### Prisma Schema Models

```prisma
model User {
  id                    String                 @id @default(cuid())
  email                 String                 @unique
  name                  String?
  avatarUrl             String?
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  transactions          Transaction[]
  budgets               Budget[]
  recurringTransactions RecurringTransaction[]
  @@map("users")
}

model Transaction {
  id            String   @id @default(cuid())
  userId        String
  title         String
  amount        Float
  type          String   // 'income' | 'expense'
  category      String
  date          String   // ISO YYYY-MM-DD
  paymentMethod String
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([userId, date])
  @@index([userId, category])
  @@map("transactions")
}

model Budget {
  id        String   @id @default(cuid())
  userId    String
  category  String
  limit     Float
  period    String   @default("monthly")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, category])
  @@index([userId])
  @@map("budgets")
}

model RecurringTransaction {
  id            String   @id @default(cuid())
  userId        String
  title         String
  amount        Float
  type          String   // 'income' | 'expense'
  category      String
  paymentMethod String
  frequency     String   // 'weekly' | 'monthly' | 'yearly'
  nextDate      String   // ISO YYYY-MM-DD
  isActive      Boolean  @default(true)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([userId, nextDate])
  @@map("recurring_transactions")
}
```

---

## 🌐 API Routes Reference

All endpoints are built using Next.js App Router route handlers (`src/app/api/...`) with strict type validation and authenticated user scoping:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Live service status, PostgreSQL latency check, and feature availability. |
| `GET` | `/api/summary` | Aggregate metrics (balance, income, expense, savings rate, breakdown, cashflow). Supports `?month=YYYY-MM`. |
| `GET` | `/api/transactions` | Query ledger with search (`?search=`), filtering (`?type=`, `?category=`, `?startDate=`, `?endDate=`), and pagination. |
| `POST` | `/api/transactions` | Create a new ledger transaction with validation. |
| `GET` | `/api/transactions/[id]` | Fetch single transaction record. |
| `PATCH` / `PUT` | `/api/transactions/[id]` | Update an existing transaction record. |
| `DELETE` | `/api/transactions/[id]` | Permanently delete a transaction from PostgreSQL. |
| `GET` | `/api/recurring` | Fetch recurring rules sorted by next due date (auto-seeds demo rules if empty). |
| `POST` | `/api/recurring` | Create a new recurring rule or subscription. |
| `GET` | `/api/recurring/[id]` | Fetch single recurring transaction rule. |
| `PATCH` | `/api/recurring/[id]` | Update rule or toggle active/paused status. |
| `DELETE` | `/api/recurring/[id]` | Delete a recurring rule. |
| `POST` | `/api/recurring/[id]/process` | **One-Click Log Now**: Posts a real transaction and advances `nextDate` to the next cycle. |
| `GET` | `/api/budgets` | Fetch budget limits with calculated actual burn rate, remaining amount, and utilization. |
| `POST` | `/api/budgets` | Create or upsert a category budget limit. |
| `PATCH` / `PUT` | `/api/budgets/[id]` | Update an existing budget limit. |
| `DELETE` | `/api/budgets/[id]` | Remove a category budget limit. |
| `GET` | `/api/auth/me` | Fetch active user session and database connectivity state. |
| `POST` | `/api/seed` | Seed realistic multi-month sample transactions, budgets, and recurring rules into PostgreSQL. |

---

## 🌐 Custom Domain Setup & DNS Configuration

If you wish to attach a custom domain (e.g. `cadenceledger.io` or `app.yourdomain.com`) to your Vercel deployment:

### 1. Add Domain in Vercel
Via Vercel CLI:
```bash
npx vercel domains add yourdomain.com
```
Or via the **Vercel Dashboard -> Project Settings -> Domains**.

### 2. Configure DNS Records at your Domain Registrar

| Record Type | Name / Host | Value / Target | Notes |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (or apex domain) | `76.76.21.21` | Points your root domain directly to Vercel's global edge network. |
| **`CNAME`** | `www` (or `app`) | `cname.vercel-dns.com` | Recommended for subdomains. |

Once DNS propagation completes (typically 1–15 minutes), Vercel automatically provisions and renews a free **Let's Encrypt SSL/TLS Certificate**.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: `v18.18+` or `v20+`
- **Package Manager**: `npm`
- **Database**: A [Supabase](https://supabase.com/) project (free tier fully supported)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/gshumie/cadence-ledger.git
cd cadence-ledger
npm install
```

> **Note**: `npm install` automatically triggers `npm run postinstall` which executes `prisma generate`.

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase connection strings in `.env`:

```env
# Transaction Pooler (Port 6543)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Pooler (Port 5432)
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Client Credentials
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push Schema to Database

Push the Prisma schema to create the `users`, `transactions`, `budgets`, and `recurring_transactions` tables in Supabase:

```bash
npx prisma db push
```

### 5. Inspect Database with Prisma Studio (Optional)

```bash
npx prisma studio
```
Visit `http://localhost:5555` to view, edit, or verify your PostgreSQL records visually.

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality Assurance & Build Verification

Run the full verification suite before committing:

```bash
# 1. Strict TypeScript check (0 errors)
npx tsc --noEmit

# 2. Strict ESLint check (0 errors, 0 warnings)
npm run lint

# 3. Production build (Next.js Turbopack)
npm run build
```

---

## 🚢 Production Deployment

Cadence Ledger is continuously deployed on Vercel:

```bash
npx vercel --prod --yes
```

- **Live URL**: [https://cadence-ledger.vercel.app](https://cadence-ledger.vercel.app)
- **Health Check**: [https://cadence-ledger.vercel.app/api/health](https://cadence-ledger.vercel.app/api/health)
- **Manifest**: [https://cadence-ledger.vercel.app/manifest.webmanifest](https://cadence-ledger.vercel.app/manifest.webmanifest)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
