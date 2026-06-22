import { Router } from 'express';
import { z } from 'zod';
import { dealQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createDealSchema = z.object({
    dealNo: z.string().min(1).optional(),
    dealDate: z.string().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    supplierId: idOrName.optional(),
    supplier: z.string().min(1).optional(),
    orderId: z.coerce.number().optional(),
    challanId: z.coerce.number().optional(),
    weighSlipId: z.coerce.number().optional(),
    tripId: z.coerce.number().optional(),
    salesInvoiceId: z.coerce.number().optional(),
    purchaseInvoiceId: z.coerce.number().optional(),
    totalValue: z.coerce.number().nonnegative().optional(),
    status: z.string().optional(),
});

const updateDealSchema = z.object({
    dealNo: z.string().min(1).optional(),
    dealDate: z.string().optional(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    supplierId: idOrName.optional(),
    supplier: z.string().min(1).optional(),
    orderId: z.coerce.number().optional(),
    challanId: z.coerce.number().optional(),
    weighSlipId: z.coerce.number().optional(),
    tripId: z.coerce.number().optional(),
    salesInvoiceId: z.coerce.number().optional(),
    purchaseInvoiceId: z.coerce.number().optional(),
    totalValue: z.coerce.number().nonnegative().optional(),
    status: z.string().optional(),
    cancelled: z.boolean().optional(),
    cancelRemark: z.string().optional(),
    cancelledAt: z.string().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const deals = await dealQueries.getAll();
    res.json(deals);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const deal = await dealQueries.getById(String(req.params.id));
    res.json(deal);
}));

router.post('/', validateBody(createDealSchema), asyncHandler(async (req, res) => {
    const deal = await dealQueries.create(req.body);
    res.status(201).json(deal);
}));

router.put('/:id', validateBody(updateDealSchema), asyncHandler(async (req, res) => {
    const deal = await dealQueries.update(String(req.params.id), req.body);
    res.json(deal);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await dealQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
