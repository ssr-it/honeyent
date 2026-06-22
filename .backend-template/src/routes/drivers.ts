import { Router } from 'express';
import { z } from 'zod';
import { driverQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createDriverSchema = z.object({
    name: z.string().min(1),
    mobile: z.string(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    licenseNumber: z.string().min(1).optional(),
    licenseExpiry: z.string().optional(),
    joiningDate: z.string().optional(),
    status: z.enum(["Active", "Off Duty"]).optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const drivers = await driverQueries.getAll();
    res.json(drivers);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const driver = await driverQueries.getById(String(req.params.id));
    res.json(driver);
}));

router.post('/', validateBody(createDriverSchema), asyncHandler(async (req, res) => {
    const driver = await driverQueries.create(req.body);
    res.status(201).json(driver);
}));

router.put('/:id', validateBody(createDriverSchema), asyncHandler(async (req, res) => {
    const driver = await driverQueries.update(String(req.params.id), req.body);
    res.json(driver);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await driverQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
