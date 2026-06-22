import { Router } from 'express';
import { z } from 'zod';
import { vehicleQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const createVehicleSchema = z.object({
    number: z.string().min(1),
    vehicleType: z.string().optional(),
    ownership: z.enum(['Own', 'Hired']).default('Own'),
    capacityTonnes: z.coerce.number().optional(),
    capacity: z.coerce.number().optional(),
    rcExpiry: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    fitnessExpiry: z.string().optional(),
    permitExpiry: z.string().optional(),
    pucExpiry: z.string().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
    const vehicles = await vehicleQueries.getAll();
    res.json(vehicles);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const vehicle = await vehicleQueries.getById(String(req.params.id));
    res.json(vehicle);
}));

router.post('/', validateBody(createVehicleSchema), asyncHandler(async (req, res) => {
    const vehicle = await vehicleQueries.create(req.body);
    res.status(201).json(vehicle);
}));

const updateVehicleSchema = z.object({
    number: z.string().min(1).optional(),
    vehicleType: z.string().optional(),
    ownership: z.enum(['Own', 'Hired']).optional(),
    capacityTonnes: z.coerce.number().optional(),
    capacity: z.coerce.number().optional(),
    rcExpiry: z.string().optional(),
    insuranceExpiry: z.string().optional(),
    fitnessExpiry: z.string().optional(),
    permitExpiry: z.string().optional(),
    pucExpiry: z.string().optional(),
});

router.put('/:id', validateBody(updateVehicleSchema), asyncHandler(async (req, res) => {
    const vehicle = await vehicleQueries.update(String(req.params.id), req.body);
    res.json(vehicle);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const result = await vehicleQueries.delete(String(req.params.id));
    res.json(result);
}));

export default router;
