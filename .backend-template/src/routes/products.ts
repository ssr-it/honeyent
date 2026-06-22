import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { productQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createProductSchema = z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1),
    hsnId: z.coerce.number().optional(),
    hsn: z.string().optional(),
    unit: z.string().default('MT'),
    gstRate: z.coerce.number().default(5),
    defaultRate: z.coerce.number().default(0),
    category: z.string().optional(),
});

// GET all products
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const products = await productQueries.getAll();
    res.json(products);
}));

// GET product by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const product = await productQueries.getById(String(req.params.id));
    res.json(product);
}));

// POST create product
router.post('/', validateBody(createProductSchema), asyncHandler(async (req: Request, res: Response) => {
    const product = await productQueries.create(req.body);
    res.status(201).json(product);
}));

// PUT update product
router.put('/:id', validateBody(createProductSchema), asyncHandler(async (req: Request, res: Response) => {
    const product = await productQueries.update(String(req.params.id), req.body);
    res.json(product);
}));

// DELETE product
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const result = await productQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
