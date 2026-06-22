import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';

// Routes
import customersRouter from './routes/customers.ts';
import suppliersRouter from './routes/suppliers.ts';
import productsRouter from './routes/products.ts';
import vehiclesRouter from './routes/vehicles.ts';
import driversRouter from './routes/drivers.ts';
import ordersRouter from './routes/orders.ts';
import invoicesRouter from './routes/invoices.ts';
import tripsRouter from './routes/trips.ts';
import dealsRouter from './routes/deals.ts';
import weighSlipsRouter from './routes/weighSlips.ts';
import deliveryChallansRouter from './routes/deliveryChallans.ts';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/weigh-slips', weighSlipsRouter);
app.use('/api/delivery-challans', deliveryChallansRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
});
