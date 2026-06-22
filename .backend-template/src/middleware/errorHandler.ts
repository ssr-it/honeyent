import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public details?: any
    ) {
        super(message);
    }
}

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            error: err.message,
            details: err.details,
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
