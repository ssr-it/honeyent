import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { customerQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createCustomerSchema = z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1),
    gst: z.string().optional(),
    mobile: z.string(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    city: z.string(),
    creditLimit: z.coerce.number().default(0),
    openingBalance: z.coerce.number().default(0),
    outstanding: z.coerce.number().default(0),
    status: z.enum(["Active", "Inactive"]).default("Active"),
});

// GET all customers
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const customers = await customerQueries.getAll(limit, offset);
    res.json(customers);
}));

// GET customer by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerQueries.getById(String(req.params.id));
    res.json(customer);
}));

// POST create customer
router.post('/', validateBody(createCustomerSchema), asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerQueries.create(req.body);
    res.status(201).json(customer);
}));

// PUT update customer
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerQueries.update(String(req.params.id), req.body);
    res.json(customer);
}));

// DELETE customer
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const result = await customerQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
