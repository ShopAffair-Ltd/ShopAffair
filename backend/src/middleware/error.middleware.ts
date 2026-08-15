import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(422).json({ message: 'Validation failed', errors: err.issues });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(' UNHANDLED ERROR');
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({
    message: 'Something went wrong',
    detail: err instanceof Error ? err.message : String(err)
  });
};