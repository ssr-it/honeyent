# Honeyent ERP - Quick Reference Guide

## 📊 Database Schema Overview

### Master Data Tables
```sql
-- Customers: All buyers/clients
-- Suppliers: All vendors
-- Drivers: Transportation staff
-- Vehicles: Fleet management
-- Products: Inventory items
-- HSN Catalog: Tax classification
```

### Transaction Tables
```sql
-- Orders: Sales orders from customers
-- Delivery Challans: Shipping documents
-- Weigh Slips: Weight verification
-- Trips: Transportation records
-- Sales Invoices: Billing to customers
-- Purchase Invoices: Billing from suppliers
```

### Composite Tables
```sql
-- Deals: Links all documents for one-shot order
-- Trip Expenses: Detailed trip costs
-- Shipping Addresses: Customer delivery locations
```

---

## 🔗 Data Relationships

```
Customer
├── Orders (one-to-many)
├── Shipping Addresses (one-to-many)
└── Sales Invoices (one-to-many)

Supplier
├── Purchase Invoices (one-to-many)
└── Orders (one-to-many)

Product
├── Orders (one-to-many)
├── Delivery Challans (one-to-many)
└── Weigh Slips (one-to-many)

Vehicle
├── Orders (one-to-many)
├── Trips (one-to-many)
└── Weigh Slips (one-to-many)

Driver
├── Orders (one-to-many)
└── Trips (one-to-many)

Order
├── Delivery Challan (one-to-one)
├── Sales Invoice (one-to-one)
├── Weigh Slip (one-to-one)
├── Trip (one-to-one)
└── Deal (one-to-one)
```

---

## 📝 Common Queries

### Customer Management
```sql
-- Get all active customers
SELECT * FROM customers WHERE status = 'Active';

-- Get customers with outstanding balance
SELECT * FROM customers WHERE outstanding > 0 ORDER BY outstanding DESC;

-- Get total credit limit by customer
SELECT name, credit_limit, outstanding, 
       (credit_limit - outstanding) as available_credit
FROM customers;

-- Get customer count by city
SELECT city, COUNT(*) FROM customers GROUP BY city;
```

### Order Management
```sql
-- Get all pending orders
SELECT o.order_no, o.order_date, c.name, p.name, o.qty, o.status
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'Pending';

-- Get orders by date range
SELECT * FROM orders 
WHERE order_date BETWEEN '2026-06-01' AND '2026-06-30'
ORDER BY order_date DESC;

-- Get order value (qty * rate)
SELECT order_no, qty, rate, (qty * rate) as total_value
FROM orders;
```

### Trip & Vehicle Management
```sql
-- Get vehicle utilization
SELECT v.number, COUNT(t.id) as trip_count, SUM(t.revenue) as total_revenue
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id
GROUP BY v.id, v.number;

-- Get vehicle with expiring documents
SELECT number, insurance_expiry, fitness_expiry, permit_expiry
FROM vehicles
WHERE insurance_expiry < CURRENT_DATE + INTERVAL '30 days'
   OR fitness_expiry < CURRENT_DATE + INTERVAL '30 days';

-- Get driver performance
SELECT d.name, COUNT(t.id) as trips, SUM(t.net_profit) as profit
FROM drivers d
LEFT JOIN trips t ON d.id = t.driver_id
GROUP BY d.id, d.name;
```

### Financial Reports
```sql
-- Sales by customer (monthly)
SELECT DATE_TRUNC('month', i.invoice_date) as month, 
       c.name, SUM(i.total_amount) as sales
FROM sales_invoices i
JOIN customers c ON i.customer_id = c.id
GROUP BY DATE_TRUNC('month', i.invoice_date), c.name;

-- GST calculation
SELECT SUM(cgst_amount) as cgst, SUM(sgst_amount) as sgst, SUM(igst_amount) as igst
FROM sales_invoices
WHERE invoice_date >= CURRENT_DATE - INTERVAL '1 month';

-- Invoice aging (AR/AP)
SELECT invoice_no, party, total_amount, 
       CURRENT_DATE - invoice_date as days_outstanding,
       CASE WHEN CURRENT_DATE - invoice_date > 30 THEN 'Overdue'
            WHEN CURRENT_DATE - invoice_date > 0 THEN 'Pending'
            ELSE 'Not Due' END as status
FROM sales_invoices
WHERE payment_status != 'Paid';
```

---

## 🎯 API Endpoints Quick Reference

### CRUD Pattern
```
GET    /api/customers              → List all
POST   /api/customers              → Create one
GET    /api/customers/:id          → Get one
PUT    /api/customers/:id          → Update one
DELETE /api/customers/:id          → Delete one
```

### Special Operations
```
PATCH  /api/orders/:id/status      → Update order status
GET    /api/orders?customerId=xxx  → Filter by customer
GET    /api/invoices/sales         → Get sales invoices
GET    /api/invoices/purchase      → Get purchase invoices
```

---

## 🚀 Setup Checklist

### Backend Setup
- [ ] Extract `.backend-template` to `honeyent-backend`
- [ ] Run `npm install` 
- [ ] Create `.env` file with DB credentials
- [ ] Create PostgreSQL database `honeyent_db`
- [ ] Run schema initialization script
- [ ] Start backend: `npm run dev`
- [ ] Verify health: `curl http://localhost:3000/health`

### Database Setup
- [ ] PostgreSQL installed and running
- [ ] Database `honeyent_db` created
- [ ] All 17 tables created (check with `\dt`)
- [ ] Indexes created for performance
- [ ] Foreign key relationships verified

### Frontend Integration
- [ ] Create `src/lib/api/clients.ts`
- [ ] Update `src/lib/store.ts` to use API
- [ ] Set `.env` with `REACT_APP_API_URL`
- [ ] Update components to use new API
- [ ] Test CRUD operations
- [ ] Verify data persistence

### Testing
- [ ] Test customer CRUD
- [ ] Test product creation
- [ ] Test order creation
- [ ] Test invoice generation
- [ ] Test status updates
- [ ] Test filtering and searching

### Production
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Setup database backups
- [ ] Enable logging
- [ ] Configure CI/CD pipeline

---

## 💾 Backup & Recovery

### Backup PostgreSQL
```bash
# Full backup
pg_dump honeyent_db > backup-$(date +%Y%m%d).sql

# Compressed backup
pg_dump honeyent_db | gzip > backup-$(date +%Y%m%d).sql.gz

# Backup specific table
pg_dump -t customers honeyent_db > customers-backup.sql
```

### Restore from Backup
```bash
# Restore full database
psql honeyent_db < backup-20260610.sql

# Restore specific table
psql honeyent_db < customers-backup.sql

# Restore from compressed file
gunzip -c backup-20260610.sql.gz | psql honeyent_db
```

---

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` to git
   - Use `.env.example` template
   - Rotate JWT secrets regularly

2. **Database**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access
   - Regular backups (daily minimum)

3. **API**
   - Implement rate limiting
   - Add JWT authentication
   - Validate all inputs
   - Use HTTPS only in production

4. **Data**
   - Encrypt sensitive fields
   - Log all transactions
   - Implement audit trail
   - GDPR/Privacy compliance

---

## 📞 Support

### Common Issues

**Port 3000 already in use?**
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Database connection refused?**
```bash
# Check PostgreSQL service
sudo service postgresql status

# Or on Mac
brew services list

# Test connection
psql -U postgres -h localhost -d honeyent_db
```

**CORS errors?**
- Verify FRONTEND_URL in backend `.env`
- Check frontend API_URL matches backend URL
- Ensure both are running on correct ports

**Migration issues?**
```bash
# List all tables
psql honeyent_db -c "\dt"

# Drop all tables and start fresh
psql honeyent_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql honeyent_db -f scripts/init-schema.sh
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| BACKEND_SETUP.md | Complete backend setup guide |
| INTEGRATION_GUIDE.md | Step-by-step frontend-backend integration |
| QUICK_REFERENCE.md | This file - quick lookup |
| .backend-template/ | Ready-to-use Node.js backend |

---

## 🎓 Learning Resources

- PostgreSQL: https://www.postgresql.org/docs/
- Express.js: https://expressjs.com/
- TanStack React Query: https://tanstack.com/query/
- Node.js: https://nodejs.org/docs/

---

**Last Updated**: June 10, 2026  
**Version**: 1.0.0  
**Maintained By**: Sumit Singh
