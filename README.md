# StockGate — Inventory Reservation System

A production-grade multi-warehouse inventory reservation platform that prevents overselling during checkout. Built with Next.js 15 App Router, TypeScript, Prisma, Supabase PostgreSQL, and Tailwind CSS.

## Features

- **Concurrency-safe reservations** — Serializable transactions + row-level locking via `SELECT ... FOR UPDATE`
- **10-minute reservation timer** — Live countdown with visual urgency states
- **Multi-warehouse inventory** — Reserve from specific warehouses, see per-warehouse stock
- **Automatic expiry cleanup** — Vercel Cron Job runs every minute to release expired holds
- **Idempotency support** — `Idempotency-Key` header prevents duplicate reservations on retries
- **Real-time stock polling** — Frontend polls every 15s for live inventory updates
- **Zod validation** — All API inputs validated with Zod schemas
- **Full TypeScript** — End-to-end type safety

## Architecture

```
Customer → POST /api/reservations
         → BEGIN SERIALIZABLE TRANSACTION
         → SELECT ... FOR UPDATE (locks inventory row)
         → Check availableUnits >= quantity
         → UPDATE inventories SET reservedUnits += quantity
         → INSERT INTO reservations (status=PENDING, expiresAt=+10min)
         → COMMIT
         → Return reservation ID → Redirect to /checkout/[id]

On confirm → UPDATE inventories SET totalUnits -= qty, reservedUnits -= qty
           → UPDATE reservations SET status=CONFIRMED

On cancel  → UPDATE inventories SET reservedUnits -= qty
           → UPDATE reservations SET status=RELEASED

Cron (*/1) → Find PENDING where expiresAt < NOW()
           → UPDATE inventories SET reservedUnits -= qty
           → UPDATE reservations SET status=EXPIRED
```

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd inventory-reservation
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **Transaction** pooler URL (port 6543) → `DATABASE_URL`
4. Copy the **Direct** connection URL (port 5432) → `DIRECT_URL`

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and DIRECT_URL
```

### 4. Run migrations and seed

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to Supabase
npm run db:seed        # Seed with sample data
```

### 5. Start development server

```bash
npm run dev
# Visit http://localhost:3000
```

## API Reference

### Products

```
GET /api/products
→ Returns all products with per-warehouse inventory levels
```

### Warehouses

```
GET /api/warehouses
→ Returns all warehouses with inventory summaries
```

### Reservations

```
POST /api/reservations
Headers: Idempotency-Key: <uuid>  (optional but recommended)
Body: {
  productId: string,
  warehouseId: string,
  quantity: number (1-100),
  customerEmail?: string
}
→ 201: Reservation created
→ 409: Insufficient stock (race condition or no stock)
→ 400: Validation error
```

```
GET /api/reservations/:id
→ 200: Reservation details
→ 410: Reservation expired (and releases stock atomically)
→ 404: Not found
```

```
POST /api/reservations/:id/confirm
→ 200: Confirmed, stock deducted from totalUnits
→ 410: Expired before payment
```

```
POST /api/reservations/:id/release
→ 200: Released, reservedUnits decremented
→ 400: Already confirmed
```

### Cron

```
GET /api/cron/expire-reservations
Headers: Authorization: Bearer <CRON_SECRET>
→ Batch-processes expired PENDING reservations
```

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `INSUFFICIENT_STOCK` | 409 | Not enough available units |
| `TRANSACTION_CONFLICT` | 409 | Serialization failure under high concurrency |
| `RESERVATION_EXPIRED` | 410 | 10-minute hold has lapsed |
| `RESERVATION_INVALID` | 410 | Already released or expired |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Zod schema failure |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Deployment to Vercel + Supabase

### Step 1: Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Import project from GitHub
2. Add environment variables:
   - `DATABASE_URL` — Supabase Transaction pooler (port 6543)
   - `DIRECT_URL` — Supabase Direct connection (port 5432)
   - `CRON_SECRET` — Random secret (e.g. `openssl rand -hex 32`)
3. Deploy

### Step 3: Run migrations on production

```bash
# Using Vercel CLI
npx vercel env pull .env.production.local
DATABASE_URL=$(grep DIRECT_URL .env.production.local | cut -d= -f2) npx prisma migrate deploy
```

Or use Supabase's SQL editor to run the migration SQL directly.

### Step 4: Seed production (optional)

```bash
DIRECT_URL=<your-direct-url> npm run db:seed
```

### Cron Job

The `vercel.json` configures a cron job at `*/1 * * * *` (every minute) to expire stale reservations. This requires a **Vercel Pro** plan. On the free plan, manually call the endpoint or use a free external cron service like [cron-job.org](https://cron-job.org).

## Concurrency Model

The system uses **PostgreSQL Serializable Isolation** with explicit row locking:

```sql
-- Locks the inventory row for the duration of the transaction
SELECT id, "totalUnits", "reservedUnits"
FROM inventories
WHERE "productId" = $1 AND "warehouseId" = $2
FOR UPDATE
```

If two users attempt to reserve the last unit simultaneously:
- **Transaction A** acquires the row lock
- **Transaction B** blocks until A commits
- A commits: reservedUnits now equals totalUnits
- B proceeds: available = 0 → throws `INSUFFICIENT_STOCK` → 409 response

Prisma's `P2034` error (serialization failure) is also caught and returns 409.

## Idempotency

Pass an `Idempotency-Key` header with any unique string (e.g., UUID):

```
POST /api/reservations
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

If the same key is used again (e.g., on retry after network timeout), the original reservation is returned instead of creating a duplicate. Keys are stored in the `reservations.idempotencyKey` unique column.

## Database Schema

```
Product          — id, name, description, sku, price, imageUrl
Warehouse        — id, name, location
Inventory        — id, productId, warehouseId, totalUnits, reservedUnits
                   UNIQUE(productId, warehouseId)
Reservation      — id, productId, inventoryId, quantity, status,
                   expiresAt, confirmedAt, releasedAt, idempotencyKey
                   status: PENDING | CONFIRMED | RELEASED | EXPIRED
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase PostgreSQL |
| ORM | Prisma 5 |
| Styling | Tailwind CSS |
| Validation | Zod |
| Fonts | Syne + JetBrains Mono |
| Deployment | Vercel |
| Cron | Vercel Cron Jobs |
