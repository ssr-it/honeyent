# Honeyent Frontend-Backend Integration Guide

## Complete Step-by-Step Integration

### Phase 1: Backend Setup (15 minutes)

#### 1.1 Extract Backend Template
```bash
# Navigate to project root
cd e:\honeyent

# Copy backend template
xcopy .backend-template honeyent-backend /E /I

cd honeyent-backend
```

#### 1.2 Install Dependencies
```bash
npm install
```

#### 1.3 Create PostgreSQL Database
```bash
# Using psql
createdb honeyent_db

# Or using pgAdmin:
# 1. Right-click "Databases" → Create → Database
# 2. Name it: honeyent_db
```

#### 1.4 Initialize Database Schema
```bash
# Windows Command Prompt
psql -U postgres -d honeyent_db -f scripts\init-schema.sh

# Or manually copy-paste the SQL from the file
```

#### 1.5 Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env with your credentials:
DATABASE_URL=postgresql://postgres:password@localhost:5432/honeyent_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=honeyent_db
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### 1.6 Start Backend Server
```bash
npm run dev
```

Expected output:
```
🚀 Server running on http://localhost:3000
Environment: development
Database: localhost:5432/honeyent_db
```

---

### Phase 2: Frontend Integration (30 minutes)

#### 2.1 Create API Client Functions

Create `src/lib/api/clients.ts`:
```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// ============ CUSTOMERS ============
export const fetchCustomers = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/customers`);
    if (!res.ok) throw new Error("Failed to fetch customers");
    return res.json();
  });

export const fetchCustomerById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/customers/${data.id}`);
    if (!res.ok) throw new Error("Failed to fetch customer");
    return res.json();
  });

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string(),
      name: z.string(),
      gst: z.string().optional(),
      mobile: z.string(),
      email: z.string().email().optional(),
      city: z.string(),
      creditLimit: z.number().default(0),
      openingBalance: z.number().default(0),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create customer");
    return res.json();
  });

export const updateCustomer = createServerFn({ method: "PUT" })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      mobile: z.string().optional(),
      email: z.string().email().optional(),
      city: z.string().optional(),
      creditLimit: z.number().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { id, ...updateData } = data;
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error("Failed to update customer");
    return res.json();
  });

// ============ PRODUCTS ============
export const fetchProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  });

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      code: z.string(),
      name: z.string(),
      unit: z.string().default("MT"),
      gstRate: z.number().default(5),
      defaultRate: z.number().default(0),
      category: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
  });

// ============ DRIVERS ============
export const fetchDrivers = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/drivers`);
    if (!res.ok) throw new Error("Failed to fetch drivers");
    return res.json();
  });

export const createDriver = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string(),
      mobile: z.string(),
      licenseNumber: z.string(),
      licenseExpiry: z.string(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create driver");
    return res.json();
  });

// ============ VEHICLES ============
export const fetchVehicles = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/vehicles`);
    if (!res.ok) throw new Error("Failed to fetch vehicles");
    return res.json();
  });

export const createVehicle = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      number: z.string(),
      ownership: z.enum(["Own", "Hired"]).default("Own"),
      capacityTonnes: z.number(),
      insuranceExpiry: z.string(),
      fitnessExpiry: z.string(),
      permitExpiry: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create vehicle");
    return res.json();
  });

// ============ ORDERS ============
export const fetchOrders = createServerFn({ method: "GET" })
  .inputValidator(z.object({ customerId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    let url = `${API_URL}/orders`;
    if (data?.customerId) {
      url += `?customerId=${data.customerId}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      orderNo: z.string(),
      orderDate: z.string(),
      customerId: z.string(),
      productId: z.string(),
      qty: z.number().positive(),
      rate: z.number().positive(),
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      freight: z.number().default(0),
      remarks: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create order");
    return res.json();
  });

export const updateOrderStatus = createServerFn({ method: "PATCH" })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/orders/${data.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    if (!res.ok) throw new Error("Failed to update order status");
    return res.json();
  });

// ============ TRIPS ============
export const fetchTrips = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/trips`);
    if (!res.ok) throw new Error("Failed to fetch trips");
    return res.json();
  });

export const createTrip = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      tripNo: z.string(),
      tripDate: z.string(),
      vehicleId: z.string(),
      driverId: z.string(),
      source: z.string(),
      destination: z.string(),
      weight: z.number().positive(),
      revenue: z.number().nonnegative(),
      tripExpenses: z.number().nonnegative().optional(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create trip");
    return res.json();
  });

// ============ INVOICES ============
export const fetchSalesInvoices = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/invoices/sales`);
    if (!res.ok) throw new Error("Failed to fetch sales invoices");
    return res.json();
  });

export const fetchPurchaseInvoices = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/invoices/purchase`);
    if (!res.ok) throw new Error("Failed to fetch purchase invoices");
    return res.json();
  });

export const createSalesInvoice = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      invoiceNo: z.string(),
      invoiceDate: z.string(),
      customerId: z.string(),
      orderId: z.string().optional(),
      subTotal: z.number(),
      cgstAmount: z.number().default(0),
      sgstAmount: z.number().default(0),
      igstAmount: z.number().default(0),
      totalAmount: z.number(),
    })
  )
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/invoices/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create sales invoice");
    return res.json();
  });
```

#### 2.2 Update Frontend Environment

Create or update `.env` in `honeyent/`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

#### 2.3 Update Store to Use API

Modify `src/lib/store.ts`:
```typescript
import {
  fetchCustomers,
  createCustomer,
  fetchProducts,
  fetchDrivers,
  fetchVehicles,
  fetchOrders,
  fetchTrips,
  fetchSalesInvoices,
  createOrder,
} from "./api/clients";

// Replace localStorage initialization with API calls
export async function initializeStore() {
  try {
    const [customers, products, drivers, vehicles, orders, trips, invoices] =
      await Promise.all([
        fetchCustomers(),
        fetchProducts(),
        fetchDrivers(),
        fetchVehicles(),
        fetchOrders(),
        fetchTrips(),
        fetchSalesInvoices(),
      ]);

    return {
      customers,
      products,
      drivers,
      vehicles,
      orders,
      trips,
      salesInvoices: invoices,
    };
  } catch (error) {
    console.error("Failed to initialize store:", error);
    throw error;
  }
}

// Replace add functions with API calls
export async function addNewCustomer(customer: Customer) {
  return createCustomer(customer);
}

export async function addNewOrder(order: Order) {
  return createOrder({
    orderNo: order.no,
    orderDate: order.date,
    customerId: order.customer,
    productId: order.product,
    qty: order.qty,
    rate: order.rate,
    vehicleId: order.vehicle,
    driverId: order.driver,
  });
}

// Similar for other entities...
```

---

### Phase 3: Testing (15 minutes)

#### 3.1 Start Both Servers
```bash
# Terminal 1: Backend
cd honeyent-backend
npm run dev

# Terminal 2: Frontend
cd honeyent
npm run dev
```

#### 3.2 Test API Endpoints
```bash
# In PowerShell or browser:

# Test health
curl http://localhost:3000/health

# Get customers
curl http://localhost:3000/api/customers

# Get products
curl http://localhost:3000/api/products

# Get drivers
curl http://localhost:3000/api/drivers

# Get vehicles
curl http://localhost:3000/api/vehicles

# Get orders
curl http://localhost:3000/api/orders
```

#### 3.3 Test Frontend
1. Open http://localhost:5173
2. Navigate to Customers → Create New
3. Add a customer → Should appear in backend DB
4. Create an order → Should link properly
5. Check dashboard → Stats should update

---

### Phase 4: Production Deployment

#### 4.1 Build Backend
```bash
cd honeyent-backend
npm run build
npm start
```

#### 4.2 Deploy Options

**Option A: Docker**
```bash
# In honeyent-backend/
docker build -t honeyent-backend .
docker run -e DATABASE_URL=... -p 3000:3000 honeyent-backend
```

**Option B: VPS (AWS/DigitalOcean)**
```bash
# SSH into server
ssh user@your-server

# Clone repo
git clone https://github.com/yourusername/honeyent.git
cd honeyent-backend

# Setup environment
echo "DATABASE_URL=..." > .env
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start "npm start" --name honeyent-backend
```

**Option C: Railway/Render/Heroku**
- Connect your GitHub repo
- Set environment variables
- Deploy automatically

---

## Common Tasks

### Add a New Endpoint

1. **Create route file** `src/routes/new-feature.ts`:
```typescript
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  // Your logic
  res.json({ data: [] });
}));

export default router;
```

2. **Register in** `src/index.ts`:
```typescript
import newFeatureRouter from './routes/new-feature.js';
app.use('/api/new-feature', newFeatureRouter);
```

3. **Add to** `src/lib/api/clients.ts`:
```typescript
export const fetchNewFeature = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/new-feature`);
    return res.json();
  });
```

### Database Migrations

1. Create migration file in `scripts/`:
```bash
scripts/migration-001-add-column.sql
```

2. Run it:
```bash
psql honeyent_db < scripts/migration-001-add-column.sql
```

### Debug Backend

```bash
# Enable verbose logging
NODE_DEBUG=* npm run dev

# Check database
psql honeyent_db
\dt  # List tables
SELECT * FROM customers;
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check PostgreSQL running on 5432 |
| 404 on API calls | Verify backend server is running on 3000 |
| CORS errors | Check FRONTEND_URL in .env matches your frontend |
| Data not saving | Verify database schema created with `\dt` in psql |
| Port already in use | `lsof -ti:3000 \| xargs kill -9` |

---

## Project Structure Summary

```
honeyent/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── clients.ts          ← All API calls
│   │   ├── store.ts                 ← State management
│   │   └── mock-data.ts             ← For testing
│   ├── routes/                      ← Page routes
│   └── components/                  ← React components

honeyent-backend/
├── src/
│   ├── config/
│   │   ├── index.ts                 ← Configuration
│   │   └── database.ts              ← DB connection
│   ├── models/
│   │   └── queries.ts               ← Database queries
│   ├── routes/
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── ...
│   ├── middleware/                  ← Error handling, validation
│   └── index.ts                     ← Server entry point
└── scripts/
    └── init-schema.sh               ← Database schema
```

---

## Next Steps

1. ✅ Backend setup & running
2. ✅ Frontend API integration
3. 📊 Add reports endpoints
4. 🔐 Implement JWT authentication
5. 📧 Add email/WhatsApp integrations
6. 💾 Setup backup strategy
7. 🚀 Deploy to production

Good luck! 🚀
