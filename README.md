# Allo Engineering Take-Home: Inventory Reservation System

A production-grade, concurrency-safe Inventory Reservation System built with **Next.js App Router**, **Prisma ORM**, and **Neon (Hosted PostgreSQL)**. 

## 🌐 Live Demo & Deployment
*   **Live Deployment URL:** (https://inventory-reservation-system-idd3.vercel.app/)
*   **GitHub Repository:** [Ramaanirudh/inventory-reservation-system](https://github.com/Ramaanirudh/inventory-reservation-system)

---

## 🛠️ How to Run the App Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18+ recommended) and **npm** installed on your system.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Ramaanirudh/inventory-reservation-system.git
cd inventory-reservation-system
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your hosted database connection strings:

```env
# Neon PostgreSQL - Pooled connection (used by Prisma Client at runtime)
DATABASE_URL="postgresql://neondb_owner:npg_qFrmoOiM80RX@ep-curly-fog-aokrbbge-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"

# Neon PostgreSQL - Direct connection (used by Prisma Migrate)
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_qFrmoOiM80RX@ep-curly-fog-aokrbbge.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
```

### 4. Run Migrations & Seed Database
Apply the Prisma schema to your database and populate the catalog with initial product, warehouse, and stock data:

```bash
# Push database migrations
npx prisma migrate dev

# Seed database
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 🔒 Concurrency Safety & Race Condition Prevention

The core requirement of this exercise is ensuring that if multiple users attempt to reserve the last unit of a product at the exact same millisecond, **exactly one succeeds** and the other fails with a `409 Conflict`. 

We guarantee this at the database level using a **Prisma Interactive Transaction** (`prisma.$transaction`):

1. **Atomic Read-and-Write:** When a reservation request comes in, we perform an atomic read of the current inventory levels inside the transaction block.
2. **Availability Check:** We compute the available stock in real-time (`quantity - reserved`). If the requested quantity exceeds availability, we immediately throw a `409` error and roll back the transaction.
3. **Database Locks:** The write operation (`reserved: { increment: quantity }`) locks the row in the inventory table, blocking concurrent transactions trying to access the same product-warehouse pair. This guarantees that multiple requests are serialized, and stock can never be double-allocated or dip below zero.
4. **All-or-Nothing execution (Atomicity):** If the reservation record creation fails for any reason after updating inventory, the transaction rolls back the inventory reservation increment automatically.

---

## ⏳ Expiry Cleanup Mechanism in Production

To ensure that abandoned reservations don't permanently deplete inventory, we implement a **hybrid cleanup strategy**:

1. **Lazy Cleanup on Read/Write (Active Expiry Gate)**:
   * When a customer attempts to confirm a reservation (e.g. clicking "Confirm Purchase" at checkout), the backend verifies the `expiresAt` timestamp against the current server time.
   * If it is expired, the backend calls `releaseReservationInternal` to release the held stock back to the warehouse inventory pool, and returns a `410 Gone` error message directly to the client. This guarantees expired reservations can never be paid for.

2. **Active Periodic Cleanup (Vercel Cron Job)**:
   * We exposed a secure, cron-friendly API endpoint at `/api/cron/cleanup-expired-reservations`.
   * In a production environment, this route is wired to a **Vercel Cron Job** running on a 1-minute schedule:
     ```json
     {
       "crons": [{
         "path": "/api/cron/cleanup-expired-reservations",
         "schedule": "* * * * *"
       }]
     }
     ```
   * Each execution gathers all pending reservations where `expiresAt` is less than `Date.now()`, releases their stock, and updates their status to `RELEASED`.

---

## 📐 Design & Trade-offs

1. **PostgreSQL Concurrency vs. Redis Distributed Locking**:
   * *Trade-off:* We used database-level transactions for locking inventory. For most D2C applications, PostgreSQL row locks inside interactive transactions are highly efficient and keep the architecture simple.
   * *Future Scale:* For extreme flash-sale volumes (e.g., millions of requests per second), moving the inventory counters to **Redis (using a distributed lock like Redlock)** would relieve pressure on the primary database, at the expense of adding distributed state syncing complexity.

2. **Reservation Window Duration**:
   * *Trade-off:* We configured `RESERVATION_WINDOW_MINUTES = 1` for this submission so that assessors can test the expiration flow without waiting 10 minutes. In a real-world store, this would be set to `10` minutes to allow sufficient time for redirect payment workflows.

3. **Database Expiry Indexing**:
   * To keep cron checks fast, we added indexes on the foreign key columns (`reservationId`, `inventoryId`) in `ReservationItem` to speed up join queries during checkout and cleanup processes.
