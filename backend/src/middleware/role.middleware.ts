import type { Request, Response, NextFunction } from 'express';
import type { AppUserRole } from '../types/express';

export const requireRole = (...roles: AppUserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to perform this action' });
      return;
    }
    next();
  };
};