import { Router } from 'express';
import { z } from 'zod';
import { deliveryChallanQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createDeliveryChallanSchema = z.object({
    challanNo: z.string().min(1).optional(),
    challanDate: z.string(),
    orderId: z.coerce.number().optional(),
    dealId: z.coerce.number().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    qty: z.coerce.number().positive(),
    hsnCode: z.string().optional(),
    gstRate: z.coerce.number().nonnegative().optional(),
    amount: z.coerce.number().nonnegative().optional(),
    status: z.string().optional(),
});

const updateDeliveryChallanSchema = z.object({
    challanNo: z.string().min(1).optional(),
    challanDate: z.string().optional(),
    orderId: z.coerce.number().optional(),
    dealId: z.coerce.number().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    qty: z.coerce.number().positive().optional(),
    hsnCode: z.string().optional(),
    gstRate: z.coerce.number().nonnegative().optional(),
    amount: z.coerce.number().nonnegative().optional(),
    status: z.string().optional(),
    cancelled: z.boolean().optional(),
    cancelRemark: z.string().optional(),
    cancelledAt: z.string().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const challans = await deliveryChallanQueries.getAll();
    res.json(challans);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const challan = await deliveryChallanQueries.getById(String(req.params.id));
    res.json(challan);
}));

router.post('/', validateBody(createDeliveryChallanSchema), asyncHandler(async (req, res) => {
    const challan = await deliveryChallanQueries.create(req.body);
    res.status(201).json(challan);
}));

router.put('/:id', validateBody(updateDeliveryChallanSchema), asyncHandler(async (req, res) => {
    const challan = await deliveryChallanQueries.update(String(req.params.id), req.body);
    res.json(challan);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await deliveryChallanQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
