# Honeyent ERP - Backend Setup Guide

## Overview
This guide connects the Honeyent frontend (React + TanStack Start) with a PostgreSQL database and Node.js backend.

---

## 1. PostgreSQL Database Schema

### Prerequisites
- PostgreSQL 13+
- pgAdmin or psql CLI

### Tables Structure

#### 1. **Company Profile**
```sql
CREATE TABLE company_profile (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(255),
  logo_text VARCHAR(100),
  owner_name VARCHAR(100),
  owner_phone VARCHAR(15),
  owner_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **Customers**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15),
  mobile VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  credit_limit DECIMAL(15,2) DEFAULT 0,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, mobile)
);

CREATE INDEX idx_customer_code ON customers(code);
CREATE INDEX idx_customer_gst ON customers(gst);
```

#### 3. **Suppliers**
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(15),
  mobile VARCHAR(15),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(30),
  bank_ifsc VARCHAR(11),
  outstanding DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, mobile)
);

CREATE INDEX idx_supplier_code ON suppliers(code);
CREATE INDEX idx_supplier_gst ON suppliers(gst);
```

#### 4. **Drivers**
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  email VARCHAR(255),
  address TEXT,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_expiry DATE,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_driver_license ON drivers(license_number);
CREATE INDEX idx_driver_mobile ON drivers(mobile);
```

#### 5. **Vehicles**
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50),
  ownership VARCHAR(20) DEFAULT 'Own', -- 'Own' or 'Hired'
  capacity_tonnes DECIMAL(10,2),
  rc_expiry DATE,
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  puc_expiry DATE,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_number ON vehicles(number);
```

#### 6. **HSN Catalog**
```sql
CREATE TABLE hsn_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hsn_code VARCHAR(8) UNIQUE NOT NULL,
  description VARCHAR(255),
  gst_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hsn_code ON hsn_catalog(hsn_code);
```

#### 7. **Products**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  hsn_id UUID REFERENCES hsn_catalog(id),
  unit VARCHAR(20) DEFAULT 'MT',
  gst_rate DECIMAL(5,2),
  default_rate DECIMAL(15,2),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_code ON products(code);
```

#### 8. **Sites / Ship-to Addresses**
```sql
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  address_name VARCHAR(100),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(6),
  contact_person VARCHAR(100),
  contact_phone VARCHAR(15),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_address_customer ON shipping_addresses(customer_id);
```

#### 9. **Expense Heads**
```sql
CREATE TABLE expense_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. **Orders**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  supplier_id UUID REFERENCES suppliers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qty DECIMAL(10,2),
  rate DECIMAL(15,2),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  ship_to_address_id UUID REFERENCES shipping_addresses(id),
  freight DECIMAL(15,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  expected_delivery DATE,
  remarks TEXT,
  status VARCHAR(30) DEFAULT 'Pending',
  deal_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_no ON orders(order_no);
CREATE INDEX idx_order_customer ON orders(customer_id);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_order_deal ON orders(deal_id);
```

#### 11. **Delivery Challans**
```sql
CREATE TABLE delivery_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_no VARCHAR(50) UNIQUE NOT NULL,
  challan_date DATE NOT NULL,
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  qty DECIMAL(10,2),
  hsn_code VARCHAR(8),
  gst_rate DECIMAL(5,2),
  amount DECIMAL(15,2),
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challan_no ON delivery_challans(challan_no);
CREATE INDEX idx_challan_order ON delivery_challans(order_id);
CREATE INDEX idx_challan_deal ON delivery_challans(deal_id);
```

#### 12. **Weigh Slips**
```sql
CREATE TABLE weigh_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_no VARCHAR(50) UNIQUE NOT NULL,
  slip_date DATE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  product_id UUID REFERENCES products(id),
  gross_weight DECIMAL(10,2),
  tare_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  customer_weight DECIMAL(10,2),
  loss_weight DECIMAL(10,2),
  deal_id UUID,
  status VARCHAR(30) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weighslip_no ON weigh_slips(slip_no);
CREATE INDEX idx_weighslip_vehicle ON weigh_slips(vehicle_id);
```

#### 13. **Trips**
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_no VARCHAR(50) UNIQUE NOT NULL,
  trip_date DATE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  source VARCHAR(255),
  destination VARCHAR(255),
  weight DECIMAL(10,2),
  revenue DECIMAL(15,2),
  trip_expenses DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2),
  deal_id UUID,
  status VARCHAR(30) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_no ON trips(trip_no);
CREATE INDEX idx_trip_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trip_driver ON trips(driver_id);
```

#### 14. **Trip Expenses**
```sql
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  expense_head_id UUID NOT NULL REFERENCES expense_heads(id),
  amount DECIMAL(15,2),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_expenses_trip ON trip_expenses(trip_id);
```

#### 15. **Sales Invoices**
```sql
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
  sub_total DECIMAL(15,2),
  cgst_amount DECIMAL(15,2) DEFAULT 0,
  sgst_amount DECIMAL(15,2) DEFAULT 0,
  igst_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'Unpaid',
  status VARCHAR(30) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_no ON sales_invoices(invoice_no);
CREATE INDEX idx_invoice_customer ON sales_invoices(customer_id);
CREATE INDEX idx_invoice_date ON sales_invoices(invoice_date);
```

#### 16. **Purchase Invoices**
```sql
CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  order_id UUID REFERENCES orders(id),
  deal_id UUID,
  sub_total DECIMAL(15,2),
  gst_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'Unpaid',
  status VARCHAR(30) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_no ON purchase_invoices(invoice_no);
CREATE INDEX idx_purchase_supplier ON purchase_invoices(supplier_id);
```

#### 17. **Deals (One-Shot Orders)**
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  supplier_id UUID REFERENCES suppliers(id),
  order_id UUID REFERENCES orders(id),
  challan_id UUID REFERENCES delivery_challans(id),
  weigh_slip_id UUID REFERENCES weigh_slips(id),
  trip_id UUID REFERENCES trips(id),
  sales_invoice_id UUID REFERENCES sales_invoices(id),
  purchase_invoice_id UUID REFERENCES purchase_invoices(id),
  deal_date DATE,
  total_value DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'Created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_no ON deals(deal_no);
CREATE INDEX idx_deal_order ON deals(order_id);
```

---

## 2. Node.js Backend Setup

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with `pg` or `prisma`
- **Validation**: Zod or Joi
- **Authentication**: JWT (optional)
- **Logging**: Winston or Pino

### Installation

```bash
# Create backend directory
mkdir honeyent-backend
cd honeyent-backend

# Initialize project
npm init -y

# Install dependencies
npm install express pg dotenv cors helmet zod

# Development dependencies
npm install -D typescript @types/express @types/node ts-node nodemon
```

### Project Structure
```
honeyent-backend/
├── src/
│   ├── controllers/
│   │   ├── customers.ts
│   │   ├── suppliers.ts
│   │   ├── drivers.ts
│   │   ├── vehicles.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── trips.ts
│   │   ├── invoices.ts
│   │   └── deals.ts
│   ├── models/
│   │   └── queries.ts
│   ├── routes/
│   │   ├── customers.ts
│   │   ├── suppliers.ts
│   │   ├── drivers.ts
│   │   ├── vehicles.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── trips.ts
│   │   ├── invoices.ts
│   │   └── deals.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── config/
│   │   └── database.ts
│   └── index.ts
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 3. Environment Setup

### `.env` File
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/honeyent_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=honeyent_db

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# JWT (if using authentication)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

### `.env.example`
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 4. Database Connection

### `src/config/database.ts`
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
```

---

## 5. Frontend Integration

### Update `src/lib/api/example.functions.ts`

Replace mock data calls with server functions that hit your backend:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Customers
export const getCustomers = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_BASE}/api/customers`);
    return res.json();
  });

export const getCustomerById = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_BASE}/api/customers/${data.id}`);
    return res.json();
  });

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    code: z.string(),
    name: z.string(),
    gst: z.string().optional(),
    mobile: z.string(),
    city: z.string(),
    creditLimit: z.number(),
  }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_BASE}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  });

// Orders
export const getOrders = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_BASE}/api/orders`);
    return res.json();
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    customerId: z.string(),
    productId: z.string(),
    qty: z.number(),
    rate: z.number(),
    vehicleId: z.string().optional(),
    driverId: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  });

// Add similar patterns for all other entities...
```

---

## 6. Update Store (localStorage → API)

### `src/lib/store.ts` Example
```typescript
import { getCustomers, createCustomer } from './api/example.functions';

export async function loadCustomers() {
  try {
    return await getCustomers();
  } catch (error) {
    console.error('Failed to load customers:', error);
    return [];
  }
}

export async function addNewCustomer(customer: Customer) {
  try {
    return await createCustomer(customer);
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
}

// Similarly for other entities...
```

---

## 7. Docker Compose (Optional)

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: honeyent_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  honeyent-backend:
    build: ./honeyent-backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/honeyent_db
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## 8. Quick Start

1. **Setup PostgreSQL**
   ```bash
   # Create database
   createdb honeyent_db
   psql honeyent_db < schema.sql
   ```

2. **Start Backend**
   ```bash
   cd honeyent-backend
   npm run dev
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Update API calls** in store and components to use server functions

---

## 9. Key Endpoints Reference

```
GET    /api/customers              - List all customers
POST   /api/customers              - Create customer
GET    /api/customers/:id          - Get customer details
PUT    /api/customers/:id          - Update customer

GET    /api/orders                 - List orders
POST   /api/orders                 - Create order
GET    /api/orders/:id             - Get order details
PUT    /api/orders/:id             - Update order status

GET    /api/trips                  - List trips
POST   /api/trips                  - Create trip
GET    /api/trips/:id              - Get trip details

GET    /api/invoices/sales         - Sales invoices
GET    /api/invoices/purchase      - Purchase invoices
POST   /api/invoices/sales         - Create sales invoice

GET    /api/deals                  - List all deals
POST   /api/deals                  - Create deal (one-shot order)

GET    /api/products               - List products
GET    /api/drivers                - List drivers
GET    /api/vehicles               - List vehicles
```

---

## Next Steps

1. Create individual controller and route files
2. Implement database queries using the schema
3. Add validation middleware
4. Implement error handling
5. Add authentication/authorization if needed
6. Replace mock data with API calls
7. Deploy backend to production server
