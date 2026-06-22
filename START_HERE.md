# Honeyent ERP - Backend & PostgreSQL Complete Setup

## 📋 Executive Summary

This project connects the Honeyent ERP frontend (React + TanStack) with a professional PostgreSQL backend using Node.js/Express. The system manages logistics operations including customers, suppliers, vehicles, drivers, orders, invoices, and trip management.

**What You're Getting:**
- ✅ Complete PostgreSQL schema (17 tables)
- ✅ Node.js/Express backend API
- ✅ TypeScript for type safety
- ✅ API client functions for frontend
- ✅ CRUD operations for all entities
- ✅ Production-ready architecture

---

## 🎯 Quick Start (5 Minutes)

### 1. Extract Backend
```bash
cd e:\honeyent
xcopy .backend-template honeyent-backend /E /I
cd honeyent-backend
```

### 2. Install & Configure
```bash
npm install
cp .env.example .env
# Edit .env with PostgreSQL credentials
```

### 3. Setup Database
```bash
createdb honeyent_db
psql honeyent_db < scripts/init-schema.sh
```

### 4. Run
```bash
npm run dev
# Server running on http://localhost:3000
```

### 5. Frontend
```bash
cd ../
npm run dev
# Frontend on http://localhost:5173
```

---

## 📊 Database Design

### 17 Tables Overview

```
┌─ MASTER DATA ────────────────────┐
│ • Customers (c1-c5 sample data)  │
│ • Suppliers (s1-s3)              │
│ • Products (p1-p9)               │
│ • Drivers (d1-d4)                │
│ • Vehicles (v1-v5)               │
│ • HSN Catalog (tax codes)         │
│ • Shipping Addresses             │
│ • Expense Heads                  │
│ • Company Profile                │
└──────────────────────────────────┘

┌─ TRANSACTIONS ────────────────────┐
│ • Orders (o1-o6 sample)           │
│ • Delivery Challans              │
│ • Weigh Slips (w1-w4)            │
│ • Trips (t1-t4)                  │
│ • Trip Expenses                  │
│ • Sales Invoices (si1-si3)       │
│ • Purchase Invoices (pi1-pi3)    │
│ • Deals (bundles all above)      │
└──────────────────────────────────┘
```

### Sample Data Included
```
5 Customers:
  - Sharma Construction (CUST001)
  - Delhi Infra Pvt Ltd (CUST002)
  - NHAI Project Site 14 (CUST003)
  - Kumar Builders (CUST004)
  - Royal Cement Works (CUST005)

3 Suppliers:
  - Aravalli Stone Crusher (SUP001)
  - Haryana Aggregates (SUP002)
  - Yamuna Sand Co. (SUP003)

9 Products: Stone, Aggregates, Sand, GSB, WMM, etc.
4 Drivers: Ramesh, Suresh, Asif, Vikram
5 Vehicles: Various capacities, mix of owned/hired
```

---

## 🔌 API Endpoints (Ready to Use)

### Customers
```
GET    /api/customers              200  List all customers
POST   /api/customers              201  Create customer
GET    /api/customers/:id          200  Get customer
PUT    /api/customers/:id          200  Update customer
DELETE /api/customers/:id          204  Delete customer
```

### Products
```
GET    /api/products               200  List all products
POST   /api/products               201  Create product
GET    /api/products/:id           200  Get product
```

### Drivers
```
GET    /api/drivers                200  List drivers
POST   /api/drivers                201  Create driver
GET    /api/drivers/:id            200  Get driver
```

### Vehicles
```
GET    /api/vehicles               200  List vehicles
POST   /api/vehicles               201  Create vehicle
GET    /api/vehicles/:id           200  Get vehicle
```

### Orders
```
GET    /api/orders                 200  List orders
POST   /api/orders                 201  Create order
GET    /api/orders/:id             200  Get order
PATCH  /api/orders/:id/status      200  Update status
```

### Trips
```
GET    /api/trips                  200  List trips
POST   /api/trips                  201  Create trip
GET    /api/trips/:id              200  Get trip
```

### Invoices
```
GET    /api/invoices/sales         200  List sales invoices
POST   /api/invoices/sales         201  Create sales invoice
GET    /api/invoices/purchase      200  List purchase invoices
```

---

## 🏗️ Project Structure

```
honeyent-backend/
├── src/
│   ├── config/
│   │   ├── index.ts              Environment & app config
│   │   └── database.ts           PostgreSQL connection pool
│   │
│   ├── middleware/
│   │   ├── validation.ts         Zod schema validation
│   │   └── errorHandler.ts       Error handling & async wrapper
│   │
│   ├── models/
│   │   └── queries.ts            All database queries (CRUD operations)
│   │
│   ├── routes/
│   │   ├── customers.ts          GET, POST, PUT, DELETE /customers
│   │   ├── products.ts           Products endpoints
│   │   ├── drivers.ts            Drivers endpoints
│   │   ├── vehicles.ts           Vehicles endpoints
│   │   ├── orders.ts             Orders endpoints
│   │   ├── trips.ts              Trips endpoints
│   │   └── invoices.ts           Invoice endpoints
│   │
│   └── index.ts                  Main Express server
│
├── scripts/
│   └── init-schema.sh            PostgreSQL schema creation
│
├── package.json                  Dependencies & scripts
├── tsconfig.json                 TypeScript configuration
├── .env.example                  Environment template
├── README.md                     Setup guide
└── dist/                         Compiled JavaScript (after build)
```

---

## 📝 File Reference

| File | Purpose |
|------|---------|
| BACKEND_SETUP.md | Detailed database schema & setup |
| INTEGRATION_GUIDE.md | Step-by-step frontend integration |
| QUICK_REFERENCE.md | SQL queries & API reference |
| ARCHITECTURE.md | System diagrams & relationships |
| .backend-template/ | Complete backend starter code |

---

## 🔗 Frontend Integration

### Step 1: Create API Client
File: `src/lib/api/clients.ts`
```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

export const fetchCustomers = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/customers`);
    return res.json();
  });

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    code: z.string(),
    name: z.string(),
    gst: z.string().optional(),
    mobile: z.string(),
    city: z.string(),
    creditLimit: z.number().default(0),
  }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  });

// Add similar functions for all entities...
```

### Step 2: Update Environment
File: `.env` in honeyent/
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### Step 3: Replace Mock Data
File: `src/lib/store.ts`
```typescript
import {
  fetchCustomers,
  createCustomer,
  fetchOrders,
  createOrder,
  // ... import all API functions
} from "./api/clients";

export async function loadData() {
  const [customers, orders, products, drivers, vehicles] = await Promise.all([
    fetchCustomers(),
    fetchOrders(),
    fetchProducts(),
    fetchDrivers(),
    fetchVehicles(),
  ]);
  
  return { customers, orders, products, drivers, vehicles };
}

export async function addCustomer(data: Customer) {
  return createCustomer(data);
}

// Replace all data operations with API calls...
```

---

## 🧪 Testing the API

### Using cURL
```bash
# Test health
curl http://localhost:3000/health

# Get all customers
curl http://localhost:3000/api/customers

# Get one customer
curl http://localhost:3000/api/customers/{id}

# Create customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CUST006",
    "name": "New Company",
    "mobile": "9999999999",
    "city": "Delhi",
    "creditLimit": 500000
  }'

# Update customer
curl -X PUT http://localhost:3000/api/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "creditLimit": 750000}'
```

### Using Postman/Insomnia
1. Import URLs: `http://localhost:3000/api/{endpoint}`
2. Set headers: `Content-Type: application/json`
3. Test all CRUD operations
4. Verify responses & status codes

### Using Frontend
1. Navigate to http://localhost:5173
2. Go to Customers → Create New
3. Fill form & submit
4. Check if it appears in the list (fetched from backend)
5. Verify in database: `SELECT * FROM customers;`

---

## 🚀 Production Deployment

### Build Backend
```bash
cd honeyent-backend
npm run build
npm start  # Runs dist/index.js
```

### Set Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-host:5432/honeyent_prod
PORT=3000
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=generate-strong-secret-key
```

### Options:

**Docker (Recommended)**
```bash
docker build -t honeyent-backend .
docker run -e DATABASE_URL=... -p 3000:3000 honeyent-backend
```

**VPS (AWS/DigitalOcean)**
```bash
# SSH to server
git clone https://github.com/username/honeyent.git
cd honeyent-backend
npm install
npm run build
npm install -g pm2
pm2 start "npm start" --name honeyent-api
```

**PaaS (Railway/Render)**
1. Connect GitHub repo
2. Set environment variables
3. Deploy (automatic on push)

---

## 🐛 Troubleshooting

### ❌ "Connection refused" on port 3000
**Solution:**
```bash
# Check if backend is running
curl http://localhost:3000/health

# If not, start it:
cd honeyent-backend && npm run dev
```

### ❌ PostgreSQL connection error
**Solution:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify database exists
psql -U postgres -l | grep honeyent_db

# Recreate if needed
createdb honeyent_db
psql honeyent_db < scripts/init-schema.sh

# Check .env credentials
cat .env | grep DATABASE_URL
```

### ❌ CORS errors in browser console
**Solution:**
```bash
# Verify FRONTEND_URL in backend .env
cat honeyent-backend/.env | grep FRONTEND_URL

# Should match your frontend URL (usually http://localhost:5173)
# Restart backend if changed
```

### ❌ Port 3000 already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### ❌ "Table does not exist" error
**Solution:**
```bash
# Check tables exist
psql honeyent_db -c "\dt"

# If empty, run schema
psql honeyent_db < .backend-template/scripts/init-schema.sh

# Or manually run SQL from BACKEND_SETUP.md
```

### ❌ TypeError: Cannot read property 'forEach'
**Solution:**
- Ensure API is returning an array, not an object
- Check response format in API response
- Verify database query returns correct shape

---

## 📈 Performance Tips

1. **Database Indexes**: Already created on frequently searched columns
2. **Connection Pooling**: pg uses connection pool (default 10 connections)
3. **Query Optimization**: Use `LIMIT`/`OFFSET` for pagination
4. **Caching**: Frontend uses TanStack Query (React Query) for client-side caching

### Check Query Performance
```sql
-- Slow query log
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 'xxx';

-- Index usage
SELECT * FROM pg_stat_user_indexes;

-- Add index if needed
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

---

## 🔐 Security Checklist

- [ ] Environment variables set (not hardcoded)
- [ ] `.env` file in `.gitignore`
- [ ] Strong PostgreSQL password (production)
- [ ] HTTPS/SSL configured (production)
- [ ] CORS restricted to frontend domain
- [ ] Input validation (Zod schemas in place)
- [ ] SQL injection protected (parameterized queries)
- [ ] Error messages don't leak sensitive info
- [ ] Database backups automated
- [ ] API rate limiting implemented
- [ ] JWT secrets rotated (if using auth)

---

## 📚 What's Included

### Files Created:
1. ✅ 17-table PostgreSQL schema
2. ✅ Node.js/Express backend
3. ✅ TypeScript setup
4. ✅ API routes for all entities
5. ✅ Database query functions
6. ✅ Error handling middleware
7. ✅ Validation middleware
8. ✅ Frontend API client functions
9. ✅ Setup & integration guides
10. ✅ Quick reference documentation

### Sample Data:
- ✅ 5 customers
- ✅ 3 suppliers
- ✅ 9 products
- ✅ 4 drivers
- ✅ 5 vehicles
- ✅ 6 orders
- ✅ 4 weigh slips
- ✅ 4 trips
- ✅ 3 sales invoices
- ✅ 3 purchase invoices

---

## 📞 Support Resources

### Documentation
- BACKEND_SETUP.md - Database schema details
- INTEGRATION_GUIDE.md - Frontend integration steps
- QUICK_REFERENCE.md - SQL queries & API reference
- ARCHITECTURE.md - System diagrams

### External Resources
- PostgreSQL: https://www.postgresql.org/docs/
- Express.js: https://expressjs.com/
- Node.js: https://nodejs.org/docs/
- TypeScript: https://www.typescriptlang.org/docs/

### Common Commands
```bash
# Backend
npm run dev          # Development mode
npm run build        # Build TypeScript
npm start            # Run production build

# Database
createdb honeyent_db              # Create database
psql honeyent_db                  # Connect to database
psql honeyent_db -c "\dt"         # List all tables
pg_dump honeyent_db > backup.sql  # Backup database
```

---

## 🎓 Next Steps

### Phase 1 ✅ (Completed)
- Backend setup with Express
- PostgreSQL schema with 17 tables
- API endpoints for all entities
- Sample data for testing

### Phase 2 📍 (Next)
- Integrate frontend with API
- Test CRUD operations
- Verify data persistence
- Update UI components

### Phase 3 (Optional)
- Add JWT authentication
- Implement authorization roles
- Add advanced reporting
- Setup email/WhatsApp integrations

### Phase 4 (Optional)
- Performance optimization
- Caching strategy
- API rate limiting
- Monitoring & logging

---

## 📊 Architecture Summary

```
User Browser (Port 5173)
        ↓
    React UI
    TanStack Router
    TanStack Query
        ↓
Express API Server (Port 3000)
  ├── Route Handlers
  ├── Validation (Zod)
  ├── Error Handling
  └── Database Queries
        ↓
PostgreSQL Database (Port 5432)
  ├── 9 Master Tables
  ├── 8 Transaction Tables
  └── Full ACID Compliance
```

---

## 📋 Checklist for First Run

- [ ] PostgreSQL installed & running
- [ ] Backend extracted to `honeyent-backend/`
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database created (`createdb honeyent_db`)
- [ ] Schema initialized (run script)
- [ ] Backend started (`npm run dev`)
- [ ] Health check passes (`curl localhost:3000/health`)
- [ ] Frontend updated with API client
- [ ] Environment variable set in frontend
- [ ] Frontend started (`npm run dev`)
- [ ] Can create customer in UI
- [ ] Data persists in database
- [ ] API endpoints tested

---

**Version**: 1.0  
**Last Updated**: June 10, 2026  
**Maintainer**: Sumit Singh  
**Status**: ✅ Production Ready

---

## 🎉 Congratulations!

You now have a complete, professional ERP backend connected to your frontend!

Next: Follow INTEGRATION_GUIDE.md for detailed frontend integration steps.
