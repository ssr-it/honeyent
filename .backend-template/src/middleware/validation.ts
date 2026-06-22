import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync(req.body);
            req.body = validated;
            next();
        } catch (error: any) {
            res.status(400).json({
                error: 'Validation error',
                details: error.errors,
            });
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = await schema.parseAsync(req.query);
            req.query = validated as any;
            next();
        } catch (error: any) {
            res.status(400).json({
                error: 'Validation error',
                details: error.errors,
            });
        }
    };
};
