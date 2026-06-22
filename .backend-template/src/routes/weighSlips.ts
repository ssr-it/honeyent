import { Router } from 'express';
import { z } from 'zod';
import { weighSlipQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createWeighSlipSchema = z.object({
    slipNo: z.string().min(1).optional(),
    slipDate: z.string(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    grossWeight: z.coerce.number().nonnegative(),
    tareWeight: z.coerce.number().nonnegative(),
    netWeight: z.coerce.number().nonnegative(),
    customerWeight: z.coerce.number().nonnegative().optional(),
    lossWeight: z.coerce.number().nonnegative().optional(),
    dealId: z.coerce.number().optional(),
    status: z.string().optional(),
});

const updateWeighSlipSchema = z.object({
    slipNo: z.string().min(1).optional(),
    slipDate: z.string().optional(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    productId: idOrName.optional(),
    product: z.string().min(1).optional(),
    grossWeight: z.coerce.number().nonnegative().optional(),
    tareWeight: z.coerce.number().nonnegative().optional(),
    netWeight: z.coerce.number().nonnegative().optional(),
    customerWeight: z.coerce.number().nonnegative().optional(),
    lossWeight: z.coerce.number().nonnegative().optional(),
    dealId: z.coerce.number().optional(),
    status: z.string().optional(),
    cancelled: z.boolean().optional(),
    cancelRemark: z.string().optional(),
    cancelledAt: z.string().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const slips = await weighSlipQueries.getAll();
    res.json(slips);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const slip = await weighSlipQueries.getById(String(req.params.id));
    res.json(slip);
}));

router.post('/', validateBody(createWeighSlipSchema), asyncHandler(async (req, res) => {
    const slip = await weighSlipQueries.create(req.body);
    res.status(201).json(slip);
}));

router.put('/:id', validateBody(updateWeighSlipSchema), asyncHandler(async (req, res) => {
    const slip = await weighSlipQueries.update(String(req.params.id), req.body);
    res.json(slip);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await weighSlipQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
