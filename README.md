# Cadence Ledger — Personal Finance & Expense Tracker

A modern, full-stack personal finance and expense tracker web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## ✨ Features

- **📊 Financial Summary Metrics**: Real-time cards calculating Total Balance, Monthly Income, Total Expenses, and Net Savings Rate with period-over-period comparisons.
- **📈 Interactive Analytics & Visualizations**:
  - **Cash Flow Trend**: Area chart tracking monthly income vs. expense performance over time.
  - **Category Breakdown**: Donut chart displaying spending distribution with hover metrics and interactive legend.
  - **Budget vs. Actual**: Grouped bar chart visualizing budgeted limits against actual burn rate.
- **🎯 Budget Planning & Limit Alerts**:
  - Category-based budget limits with real-time percentage utilization.
  - Visual status indicators (**On Track**, **Near Limit** at 80%+, **Over Budget** at 100%+).
  - Dynamic insight banners highlighting at-risk spending categories.
  - Interactive modal to adjust and persist budget limits with immediate recalculation.
- **💳 Comprehensive Transaction Ledger**:
  - Instant live search across merchant/title, category, notes, and amount.
  - Filtering by transaction type (**All**, **Income**, **Expense**), category, and date range preset (**This Month**, **Last Month**, **Last 3 Months**, **This Year**, **All**).
  - Multi-column sorting (Date, Amount, Merchant).
  - Add, edit, and delete transactions with instant UI updates and celebratory confetti animations.
  - Pagination controls with configurable items per page.
- **📥 CSV Data Portability**:
  - Export filtered or all ledger transactions directly into RFC-4180 compliant CSV format.
  - Import external bank statements via CSV parser.
- **🌓 Dark & Light Mode**: Theme switching with system preference detection and local storage persistence.
- **🗄️ Resilient Architecture (Database & Offline Fallback)**:
  - First-class PostgreSQL integration via Prisma ORM and Supabase.
  - Graceful fallback to local cache/sample data if the database is disconnected or offline.
  - Built-in one-click database sync and demo dataset seed endpoints.

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
   - Required by Prisma for migrations (`npx prisma migrate dev`) and schema synchronization (`npx prisma db push`), as DDL statements and advisory locks cannot run in transaction mode.

### Prisma Schema Models

- **`User`**: Core user entity (`id`, `email`, `name`, `avatarUrl`, timestamps).
- **`Transaction`**: Records income and expense entries (`userId`, `title`, `amount`, `type`, `category`, `date`, `paymentMethod`, `notes`). Indexed by `[userId]`, `[userId, date]`, and `[userId, category]`.
- **`Budget`**: Monthly category limits (`userId`, `category`, `limit`, `period`). Unique on `[userId, category]`.

---

## 🌐 API Routes Summary

All endpoints are built using Next.js App Router route handlers (`src/app/api/...`) with strict type validation:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/summary` | Aggregate metrics (balance, income, expense, savings rate, category breakdown, cashflow trend). Supports `?month=YYYY-MM`. |
| `GET` | `/api/transactions` | Fetch transactions with search (`?search=`), filtering (`?type=`, `?category=`, `?startDate=`, `?endDate=`), and pagination (`?page=`, `?limit=`). |
| `POST` | `/api/transactions` | Create a new transaction with input validation. |
| `GET` | `/api/transactions/[id]` | Fetch a single transaction by ID. |
| `PATCH` / `PUT` | `/api/transactions/[id]` | Update an existing transaction. |
| `DELETE` | `/api/transactions/[id]` | Delete a transaction permanently from PostgreSQL. |
| `GET` | `/api/budgets` | Fetch budget limits with calculated actual spending, remaining amount, and utilization percentage. |
| `POST` | `/api/budgets` | Create or upsert a category budget limit. |
| `PATCH` / `PUT` | `/api/budgets/[id]` | Update an existing budget limit. |
| `DELETE` | `/api/budgets/[id]` | Remove a category budget limit. |
| `GET` | `/api/auth/me` | Fetch or auto-provision the default active session user. |
| `POST` | `/api/seed` | Seed realistic multi-month sample transactions and budgets into PostgreSQL. |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A [Supabase](https://supabase.com/) project (free tier is fully supported)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/cadence-ledger.git
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

Push the Prisma schema to create the `users`, `transactions`, and `budgets` tables in Supabase:

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

## 🚢 Vercel Deployment Guide

Deploying Cadence Ledger to Vercel is seamless:

### Step 1: Push Code to GitHub
Ensure all changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: complete personal finance tracker with Prisma & Supabase"
git push origin master
```

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Select your `cadence-ledger` repository and click **Import**.
3. Keep the default build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (or left default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default, which automatically executes `postinstall: prisma generate`)

### Step 3: Add Environment Variables in Vercel
In the Vercel project configuration page under **Environment Variables**, add:

| Key | Value | Target Environments |
| :--- | :--- | :--- |
| `DATABASE_URL` | Your Supabase transaction pooler URL (port `6543`, `?pgbouncer=true`) | Production, Preview, Development |
| `DIRECT_URL` | Your Supabase session pooler URL (port `5432`) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[YOUR-PROJECT-REF].supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key | Production, Preview, Development |
| `NEXTAUTH_SECRET` | A secure random 32-character string | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-deployment-url.vercel.app` (or leave default for preview) | Production |

### Step 4: Deploy
Click **Deploy**. Vercel will:
1. Install dependencies and trigger `prisma generate` via `postinstall`.
2. Compile and optimize the Next.js App Router application.
3. Deploy the application to a worldwide edge/serverless network.

### Step 5: Post-Deployment Verification
- Open your live Vercel URL.
- Check the **Supabase DB** status indicator in the top header.
- Add a test transaction and verify it saves and updates the dashboard charts in real time.

---

## 📄 License

This project is licensed under the MIT License.
