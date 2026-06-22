import { Router } from 'express';
import { z } from 'zod';
import { tripQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createTripSchema = z.object({
    tripNo: z.string().min(1).optional(),
    date: z.string(),
    tripDate: z.string().optional(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    driverId: idOrName.optional(),
    driver: z.string().min(1).optional(),
    source: z.string(),
    destination: z.string(),
    weight: z.coerce.number().positive(),
    revenue: z.coerce.number().nonnegative(),
    tripExpenses: z.coerce.number().nonnegative().default(0),
    dealId: z.coerce.number().optional(),
}).refine((data) => !!(data.vehicle || data.vehicleId), {
    message: 'vehicle or vehicleId is required',
    path: ['vehicle', 'vehicleId'],
}).refine((data) => !!(data.driver || data.driverId), {
    message: 'driver or driverId is required',
    path: ['driver', 'driverId'],
});

const updateTripSchema = z.object({
    tripNo: z.string().min(1).optional(),
    date: z.string().optional(),
    tripDate: z.string().optional(),
    vehicleId: idOrName.optional(),
    vehicle: z.string().min(1).optional(),
    driverId: idOrName.optional(),
    driver: z.string().min(1).optional(),
    source: z.string().optional(),
    destination: z.string().optional(),
    weight: z.coerce.number().positive().optional(),
    revenue: z.coerce.number().nonnegative().optional(),
    tripExpenses: z.coerce.number().nonnegative().optional(),
    status: z.string().optional(),
    dealId: z.coerce.number().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const trips = await tripQueries.getAll();
    res.json(trips);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const trip = await tripQueries.getById(String(req.params.id));
    res.json(trip);
}));

router.post('/', validateBody(createTripSchema), asyncHandler(async (req, res) => {
    const trip = await tripQueries.create(req.body);
    res.status(201).json(trip);
}));

router.put('/:id', validateBody(updateTripSchema), asyncHandler(async (req, res) => {
    const trip = await tripQueries.update(String(req.params.id), req.body);
    res.json(trip);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await tripQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
