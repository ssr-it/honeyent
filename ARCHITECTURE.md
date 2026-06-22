# Architecture Diagram - Honeyent ERP

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  React + TanStack Router + TanStack Query                    │
│  - src/routes/ - Page components                             │
│  - src/components/ - UI components                           │
│  - src/lib/api/clients.ts - API client functions             │
│  - src/lib/store.ts - Global state                           │
│                                                               │
│  Browser: http://localhost:5173                              │
│                                                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   BACKEND LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Express.js Server: http://localhost:3000                    │
│  - src/routes/ - API endpoints                               │
│  - src/models/queries.ts - Database queries                  │
│  - src/middleware/ - Error handling, validation              │
│  - src/config/ - Configuration & DB connection               │
│                                                               │
│  API Endpoints:                                              │
│  ├── /api/customers (CRUD)                                   │
│  ├── /api/suppliers (CRUD)                                   │
│  ├── /api/products (CRUD)                                    │
│  ├── /api/drivers (CRUD)                                     │
│  ├── /api/vehicles (CRUD)                                    │
│  ├── /api/orders (CRUD + status updates)                     │
│  ├── /api/trips (CRUD + P&L)                                 │
│  └── /api/invoices (sales + purchase)                        │
│                                                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ SQL Queries
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PostgreSQL 13+ (localhost:5432/honeyent_db)                 │
│                                                               │
│  Master Tables:                                              │
│  ├── customers - Buyers/Clients                              │
│  ├── suppliers - Vendors                                     │
│  ├── products - Inventory items                              │
│  ├── drivers - Transportation staff                          │
│  └── vehicles - Fleet                                        │
│                                                               │
│  Transaction Tables:                                         │
│  ├── orders - Sales orders                                   │
│  ├── delivery_challans - Shipping docs                       │
│  ├── weigh_slips - Weight verification                       │
│  ├── trips - Transport records                               │
│  ├── sales_invoices - Customer billing                       │
│  └── purchase_invoices - Vendor billing                      │
│                                                               │
│  Support Tables:                                             │
│  ├── hsn_catalog - Tax codes                                 │
│  ├── shipping_addresses - Delivery locations                 │
│  ├── expense_heads - Cost categories                         │
│  ├── trip_expenses - Detailed costs                          │
│  └── deals - One-shot order bundles                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow - One-Shot Order Example

```
┌──────────────┐
│  User clicks │
│  "New Order" │
└───────┬──────┘
        │
        ▼
┌──────────────────────┐
│  One-Shot Dialog     │
│  - Customer          │
│  - Product           │
│  - Qty & Rate        │
│  - Vehicle & Driver  │
│  - Ship-to address   │
└──────────┬───────────┘
           │ Submit
           ▼
┌──────────────────────────┐
│  Frontend: createOrder() │
│  POST /api/orders        │
└──────────┬───────────────┘
           │ HTTP
           ▼
┌───────────────────────────┐
│  Backend: POST /orders    │
│  - Validate data (Zod)    │
│  - Insert into DB         │
│  - Generate order_no      │
└──────────┬────────────────┘
           │
           ▼ Auto-create linked docs:
        ┌──────────────────────────────┐
        │ 1. Create Order              │
        │    (order_id: xxx)           │
        │ 2. Create Delivery Challan   │
        │    (references order_id)     │
        │ 3. Create Weigh Slip (draft) │
        │    (references order_id)     │
        │ 4. Create Trip               │
        │    (references order_id)     │
        │ 5. Create Sales Invoice      │
        │    (references order_id)     │
        │ 6. Create Purchase Invoice   │
        │    (if supplier set)         │
        │ 7. Create Deal               │
        │    (bundles all above)       │
        └──────────┬───────────────────┘
                   │
                   ▼ All in DB
            ┌─────────────┐
            │  Response:  │
            │  { deal_id, │
            │    order_id,│
            │    ... }    │
            └─────────────┘
                   │ HTTP
                   ▼
            ┌──────────────────┐
            │  Frontend:       │
            │  Update UI       │
            │  Show new record │
            │  in all modules  │
            └──────────────────┘
```

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐       ┌──────────────────┐              │
│  │ Dashboard       │       │ Customers        │              │
│  │ - Stats         │──────▶│ - List           │              │
│  │ - Recent Orders │       │ - Create/Edit    │              │
│  └────────┬────────┘       └────────┬─────────┘              │
│           │                         │                        │
│           │                         ▼                        │
│           │                   ┌─────────────┐                │
│           │                   │ One-Shot    │                │
│           │                   │ Order Form  │                │
│           │                   └──────┬──────┘                │
│           │                          │                       │
│           │     ┌─────────────────────┘                      │
│           │     │                                            │
│           ▼     ▼                                            │
│      ┌────────────────────────┐                              │
│      │ TanStack Query         │                              │
│      │ (React Query Cache)    │                              │
│      └────────────┬───────────┘                              │
│                   │ useQuery/useMutation                     │
│                   │                                          │
│                   ▼                                          │
│      ┌────────────────────────┐                              │
│      │ API Client Functions   │                              │
│      │ src/lib/api/clients.ts │                              │
│      │ - fetchCustomers()     │                              │
│      │ - createOrder()        │                              │
│      │ - fetchTrips()         │                              │
│      └────────────┬───────────┘                              │
│                   │ createServerFn                           │
│                   │                                          │
│                   ▼                                          │
│      ┌────────────────────────┐                              │
│      │ Server Functions       │                              │
│      │ (TanStack Start)       │                              │
│      │ - Runs on backend      │                              │
│      │ - Can access secrets   │                              │
│      └────────────┬───────────┘                              │
│                   │ fetch() to Express                       │
│                   │                                          │
│                   ▼                                          │
│           ┌───────────────┐                                   │
│           │ Express API   │                                   │
│           │ (http://...)  │                                   │
│           └───────────────┘                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Relationship Map

```
                    ┌─────────────┐
                    │   Company   │
                    │   Profile   │
                    └─────────────┘
                           │
                           │ 1-to-1
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌────────────┐    ┌──────────┐      ┌──────────┐
   │ Customers  │    │Suppliers │      │ Products │
   │            │    │          │      │          │
   │ id (PK)    │    │ id (PK)  │      │ id (PK)  │
   │ name       │    │ name     │      │ name     │
   │ gst        │    │ gst      │      │ hsn_id──────┐
   │ credit_lim │    │ bank...  │      │ gst_rate │   │
   │ status     │    │ status   │      │ rate     │   │
   └────┬───────┘    └────┬─────┘      └─┬───────┘   │
        │1                │1             │1           │
        │ n               │ n            │ n         │
        ▼                 ▼              ▼           │
   ┌──────────┐      ┌───────────┐    ┌──────────┐  │
   │ Orders   │      │ Purchase  │    │ Delivery │  │
   │          │      │ Invoices  │    │ Challans │  │
   │ order_no ├──────┤ invoice#  │    │          ├──┘
   │ customer ├──┐   │ supplier──┴─┐  │ product──┤
   │ product──┼──┼───┤             │  │ order    │
   │ qty,rate │  │   │             │  │ status   │
   │ vehicle  │  │   └─────────────┘  └──────────┘
   │ driver   │  │
   │ status   │  │
   └──┬───────┘  │   ┌──────────────┐
      │ 1        └───┤ Sales        │
      │ n            │ Invoices     │
      ▼              │              │
   ┌────────────┐    │ invoice#     │
   │ Trips      │    │ customer     │
   │            │    │ order────────┤
   │ trip#      │    │ sales_amt    │
   │ vehicle────┤    │ gst_amt      │
   │ driver─────┤    │ status       │
   │ revenue    │    └──────────────┘
   │ expenses   │
   │ status     │
   └────┬───────┘
        │ 1
        │ n (multiple)
        ▼
   ┌──────────────┐
   │ Trip         │
   │ Expenses     │
   │              │
   │ trip_id──────┤
   │ exp_head_id  │
   │ amount       │
   └──────────────┘


   ┌────────────┐    ┌──────────────┐
   │ Drivers    │    │ Vehicles     │
   │            │    │              │
   │ name       │    │ number       │
   │ license    │    │ capacity     │
   │ status     │    │ insurance    │
   └─┬──────────┘    └──┬───────────┘
     │1                  │1
     │ n                 │ n
     ├─ Orders         ├─ Orders
     ├─ Trips          ├─ Trips
     └─ Weigh Slips    └─ Weigh Slips


   ┌──────────────────┐
   │ Weigh Slips      │
   │                  │
   │ slip_no          │
   │ vehicle──────────┤
   │ product──────────┤
   │ gross,tare,net   │
   │ loss             │
   └──────────────────┘


   ┌───────────────────┐
   │ Deals             │ (One-Shot Order Bundle)
   │ (Master Bundle)   │
   │                   │
   │ order_id──────────┤─────┐
   │ challan_id────────┤─┐   │
   │ weigh_slip_id─────┤─┤   │
   │ trip_id───────────┤─┤   │
   │ sales_inv_id──────┤─┤───┤─ Links all related docs
   │ purchase_inv_id───┤─┘   │
   │                   │     │
   │ status: Created   │     │
   │         Complete  │     │
   │         Closed    │     │
   └───────────────────┘     │
                             │
                    All in one deal
                    auto-created
```

---

**Diagram Version**: 1.0  
**Last Updated**: June 10, 2026
