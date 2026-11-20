# Cadence Ledger — Personal Finance & Expense Tracker

A modern, full-stack personal finance and expense tracker web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## ✨ Features

- **📊 Financial Summary Metrics**: Real-time cards calculating Total Balance, Monthly Income, Total Expenses, and Net Savings Rate with period-over-period comparisons.
- **📈 Interactive Analytics & Visualizations**:
  - **Cash Flow Trend**: Area chart tracking monthly income vs. expense performance over time.
  - **Category Breakdown**: Donut chart displaying spending distribution with hover metrics and interactive legend.
  - **Budget vs. Actual**: Grouped bar chart visualizing budgeted limits against actual burn rate.
- **🔄 Recurring Transactions & Subscriptions**:
  - Track repetitive income and recurring bills (weekly, monthly, yearly cycles).
  - Next due date tracking with automatic month-end rollover protection.
  - **One-Click "Log Now"**: Instantly post recurring transactions to the ledger and advance the date to the next cycle.
  - Normalized KPI metrics: Monthly Fixed Outflow, Recurring Inflow, and Active Rules count.
- **🔔 Smart Alerts & Spending Thresholds**:
  - Proactive banner highlighting bills due within 7 days (or overdue) with one-click navigation.
  - Visual budget status indicators (**On Track**, **Near Limit** at 75%+, **Over Budget** at 100%+).
  - Interactive modal to adjust and persist budget limits with immediate recalculation.
- **🇪🇹 Dual Currency Support (ETB & USD)**:
  - One-click header toggle between **US Dollar ($)** and **Ethiopian Birr (Br ETB)**.
  - Dynamic currency formatting across dashboard cards, charts, budget bars, transactions ledger, and modals.
  - Persistent preference saved in `localStorage`.
- **🔐 Multi-User Authentication & Demo Mode**:
  - Supabase Auth integration with secure JWT bearer authentication.
  - Instant **Demo Mode** (`usr_cadence_default`) for evaluating features without registration.
  - Strict user-scoped database isolation across all Prisma models.
- **💳 Comprehensive Transaction Ledger**:
  - Instant live search across merchant/title, category, notes, and amount.
  - Filtering by transaction type (**All**, **Income**, **Expense**), category, and date range preset.
  - Multi-column sorting (Date, Amount, Merchant).
  - Add, edit, and delete transactions with instant UI updates and celebratory confetti animations.
  - Pagination controls with configurable items per page.
- **📥 CSV Data Portability**:
  - Export filtered or all ledger transactions directly into RFC-4180 compliant CSV format.
  - Import external bank statements via CSV parser.
- **🛡️ Production Hardened & Resilient**:
  - Standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
  - Global error boundary (`error.tsx`) and smooth suspense loading UI (`loading.tsx`).
  - Dedicated service and database connectivity health check (`/api/health`).
- **🌓 Dark & Light Mode**: Theme switching with system preference detection and local storage persistence.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database & ORM** | [Supabase](https://supabase.com/) (PostgreSQL) + [Prisma ORM 6](https://www.prisma.io/) |
| **Data Visualization** | [Recharts 3](https://recharts.org/) |
| **Icons & UI FX** | [Lucide React](https://lucide.dev/), [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Deployment** | [Vercel](https://vercel.com/) |

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

- **`User`**: Core user entity (`id`, `email`, `name`, `avatarUrl`, timestamps).
- **`Transaction`**: Records income and expense entries (`userId`, `title`, `amount`, `type`, `category`, `date`, `paymentMethod`, `notes`). Indexed by `[userId]`, `[userId, date]`, and `[userId, category]`.
- **`Budget`**: Monthly category limits (`userId`, `category`, `limit`, `period`). Unique on `[userId, category]`.
- **`RecurringTransaction`**: Automated recurrence rules (`userId`, `title`, `amount`, `type`, `category`, `paymentMethod`, `frequency`, `nextDate`, `isActive`, `notes`). Indexed by `[userId]` and `[userId, nextDate]`.

---

## 🌐 API Routes Summary

All endpoints are built using Next.js App Router route handlers (`src/app/api/...`) with strict type validation and authenticated user scoping:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, database latency, and connectivity check. |
| `GET` | `/api/summary` | Aggregate metrics (balance, income, expense, savings rate, category breakdown, cashflow trend). Supports `?month=YYYY-MM`. |
| `GET` | `/api/transactions` | Fetch transactions with search (`?search=`), filtering (`?type=`, `?category=`, `?startDate=`, `?endDate=`), and pagination (`?page=`, `?limit=`). |
| `POST` | `/api/transactions` | Create a new transaction with input validation. |
| `GET` | `/api/transactions/[id]` | Fetch a single transaction by ID. |
| `PATCH` / `PUT` | `/api/transactions/[id]` | Update an existing transaction. |
| `DELETE` | `/api/transactions/[id]` | Delete a transaction permanently from PostgreSQL. |
| `GET` | `/api/recurring` | Fetch recurring rules sorted by next due date; auto-seeds demo subscriptions if empty. |
| `POST` | `/api/recurring` | Create a new recurring rule or subscription. |
| `GET` | `/api/recurring/[id]` | Fetch a single recurring transaction rule. |
| `PATCH` | `/api/recurring/[id]` | Update rule or toggle active/paused status. |
| `DELETE` | `/api/recurring/[id]` | Delete a recurring rule. |
| `POST` | `/api/recurring/[id]/process` | **One-Click Log Now**: Creates a real ledger transaction and advances `nextDate` to the next cycle. |
| `GET` | `/api/budgets` | Fetch budget limits with calculated actual spending, remaining amount, and utilization percentage. |
| `POST` | `/api/budgets` | Create or upsert a category budget limit. |
| `PATCH` / `PUT` | `/api/budgets/[id]` | Update an existing budget limit. |
| `DELETE` | `/api/budgets/[id]` | Remove a category budget limit. |
| `GET` | `/api/auth/me` | Fetch active session user and database connection state. |
| `POST` | `/api/seed` | Seed realistic multi-month sample transactions, budgets, and recurring rules. |

---

## 🌐 Custom Domain Setup & DNS Configuration

If you wish to attach a custom domain (e.g. `cadenceledger.io` or `app.yourdomain.com`) to your Vercel deployment:

### 1. Add Domain in Vercel
Via Vercel CLI:
```bash
npx vercel domains add yourdomain.com
```
Or via the Vercel Dashboard under **Project Settings -> Domains**.

### 2. Configure DNS Records at your Domain Registrar

| Record Type | Name / Host | Value / Target | Notes |
| :--- | :--- | :--- | :--- |
| **`A`** | `@` (or apex domain) | `76.76.21.21` | Points your root domain directly to Vercel's global edge network. |
| **`CNAME`** | `www` (or `app`) | `cname.vercel-dns.com` | Recommended for subdomains. |

Once DNS propagation completes (typically 1–15 minutes), Vercel automatically provisions and renews a free **Let's Encrypt SSL/TLS Certificate**.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A [Supabase](https://supabase.com/) project (free tier is fully supported)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/gshumie/cadence-ledger.git
cd cadence-ledger
npm install
```

> **Note**: `npm install` automatically triggers `npm run postinstall` which runs `prisma generate`.

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase connection strings:

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

Run the following checks before committing or deploying:

```bash
# 1. TypeScript type checking (0 errors)
npx tsc --noEmit

# 2. ESLint check (0 errors, 0 warnings)
npm run lint

# 3. Next.js production build
npm run build
```

---

## 🚢 Vercel Production Deployment

```bash
# Deploy to production with Vercel CLI
npx vercel --prod --yes
```

Live Production Deployment: **[https://cadence-ledger.vercel.app](https://cadence-ledger.vercel.app)**

---

## 📄 License

This project is licensed under the MIT License.
