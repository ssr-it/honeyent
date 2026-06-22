# Honeyent Backend - Quick Start

## Backend Installation & Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### 2. Extract Backend Template
```bash
cp -r .backend-template honeyent-backend
cd honeyent-backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup PostgreSQL

**Option A: Using psql**
```bash
# Create database
createdb honeyent_db

# Run schema
psql honeyent_db < scripts/init-schema.sh
```

**Option B: Using pgAdmin**
- Create new database: `honeyent_db`
- Execute schema scripts from `scripts/init-schema.sh`

### 5. Configure Environment
```bash
# Copy and edit .env
cp .env.example .env

# Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:password@localhost:5432/honeyent_db
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 6. Start Development Server
```bash
npm run dev
```

Server will run on: http://localhost:3000

### 7. Verify Installation
```bash
# Health check
curl http://localhost:3000/health

# Get customers
curl http://localhost:3000/api/customers
```

---

## Frontend Integration

### Update `src/lib/api/example.functions.ts`

Replace mock data with API calls:

```typescript
import { createServerFn } from "@tanstack/react-start";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const getCustomers = createServerFn({ method: "GET" })
  .handler(async () => {
    const res = await fetch(`${API_URL}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  });

export const createCustomer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    code: z.string(),
    name: z.string(),
    mobile: z.string(),
    city: z.string(),
    creditLimit: z.number(),
  }))
  .handler(async ({ data }) => {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create customer');
    return res.json();
  });
```

### Update `.env` in Frontend
```env
REACT_APP_API_URL=http://localhost:3000/api
```

---

## API Endpoints

### Customers
- `GET /api/customers` - List all
- `GET /api/customers/:id` - Get one
- `POST /api/customers` - Create
- `PUT /api/customers/:id` - Update
- `DELETE /api/customers/:id` - Delete

### Products
- `GET /api/products` - List all
- `POST /api/products` - Create

### Drivers
- `GET /api/drivers` - List all
- `POST /api/drivers` - Create

### Vehicles
- `GET /api/vehicles` - List all
- `POST /api/vehicles` - Create

### Orders
- `GET /api/orders` - List all
- `POST /api/orders` - Create
- `PATCH /api/orders/:id/status` - Update status

---

## Production Deployment

### Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
DATABASE_URL=postgresql://[prod-user]:[prod-pass]@[prod-host]:5432/[prod-db]
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=[generate-strong-secret]
```

---

## Troubleshooting

**Connection refused?**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify DB credentials

**Migration failed?**
- Run: `psql honeyent_db < scripts/init-schema.sh`
- Check for existing tables

**Port already in use?**
- Change PORT in .env
- Or kill existing process: `lsof -ti:3000 | xargs kill -9`

---

## Next Steps

1. ✅ Backend running on port 3000
2. ✅ PostgreSQL connected
3. 📝 Update frontend API calls
4. 🧪 Test each endpoint
5. 🔐 Add authentication (JWT)
6. 📊 Implement reports endpoint
7. 🚀 Deploy to production
