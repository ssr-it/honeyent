import { Router } from 'express';
import { z } from 'zod';
import { orderQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createOrderSchema = z.object({
    orderNo: z.string().min(1).optional(),
    orderDate: z.string().optional(),
    date: z.string().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    supplierId: idOrName.optional(),
    supplier: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    qty: z.coerce.number().positive(),
    rate: z.coerce.number().positive(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    driverId: idOrName.optional(),
    driver: z.string().min(1).optional(),
    shipToAddressId: z.coerce.number().optional(),
    freight: z.coerce.number().default(0),
    paymentTerms: z.string().optional(),
    expectedDelivery: z.string().optional(),
    remarks: z.string().optional(),
    status: z.string().optional(),
    dispatchNo: z.string().optional(),
    dealId: z.coerce.number().optional(),
}).refine((data) => !!(data.customerId || data.customer), {
    message: 'customerId or customer is required',
    path: ['customerId', 'customer'],
}).refine((data) => !!(data.productId || data.product), {
    message: 'productId or product is required',
    path: ['productId', 'product'],
}).refine((data) => !!(data.orderDate || data.date), {
    message: 'orderDate or date is required',
    path: ['orderDate', 'date'],
});

const updateOrderSchema = z.object({
    orderNo: z.string().min(1).optional(),
    orderDate: z.string().optional(),
    date: z.string().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    supplierId: idOrName.optional(),
    supplier: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    qty: z.coerce.number().positive().optional(),
    rate: z.coerce.number().positive().optional(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    driverId: idOrName.optional(),
    driver: z.string().min(1).optional(),
    shipToAddressId: z.coerce.number().optional(),
    freight: z.coerce.number().optional(),
    paymentTerms: z.string().optional(),
    expectedDelivery: z.string().optional(),
    remarks: z.string().optional(),
    status: z.string().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const customerId = req.query.customerId as string | undefined;
    const orders = await orderQueries.getAll(customerId);
    res.json(orders);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const order = await orderQueries.getById(String(req.params.id));
    res.json(order);
}));

router.post('/', validateBody(createOrderSchema), asyncHandler(async (req, res) => {
    const order = await orderQueries.create(req.body);
    res.status(201).json(order);
}));

router.put('/:id', validateBody(updateOrderSchema), asyncHandler(async (req, res) => {
    const order = await orderQueries.update(String(req.params.id), req.body);
    res.json(order);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await orderQueries.delete(String(req.params.id));
    res.json(result);
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await orderQueries.updateStatus(String(req.params.id), status);
    res.json(order);
}));

export default router;
