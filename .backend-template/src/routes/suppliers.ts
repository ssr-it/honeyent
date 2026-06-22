import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supplierQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createSupplierSchema = z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1),
    gst: z.string().optional(),
    mobile: z.string(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    city: z.string(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankIfsc: z.string().optional(),
    openingBalance: z.coerce.number().default(0),
    outstanding: z.coerce.number().default(0),
});

router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const suppliers = await supplierQueries.getAll(limit, offset);
    res.json(suppliers);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierQueries.getById(String(req.params.id));
    res.json(supplier);
}));

router.post('/', validateBody(createSupplierSchema), asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierQueries.create(req.body);
    res.status(201).json(supplier);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const supplier = await supplierQueries.update(String(req.params.id), req.body);
    res.json(supplier);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const result = await supplierQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
