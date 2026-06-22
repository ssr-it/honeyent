import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { hsnQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createHsnSchema = z.object({
    code: z.string().min(1),
    gstRate: z.coerce.number().default(0),
    description: z.string().optional(),
});

router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const codes = await hsnQueries.getAll();
    res.json(codes);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const code = await hsnQueries.getById(String(req.params.id));
    res.json(code);
}));

router.post('/', validateBody(createHsnSchema), asyncHandler(async (req: Request, res: Response) => {
    const code = await hsnQueries.create(req.body);
    res.status(201).json(code);
}));

router.put('/:id', validateBody(createHsnSchema), asyncHandler(async (req: Request, res: Response) => {
    const code = await hsnQueries.update(String(req.params.id), req.body);
    res.json(code);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const result = await hsnQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
