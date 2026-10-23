import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import type { AuthPayload } from '../types/express';
import { syncStoreLockState } from '../modules/subscriptions/subscription.service';


export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { isFrozen: true, frozenReason: true }
    });

    if (!user) {
      res.status(401).json({ message: 'Account not found' });
      return;
    }
    if (user.isFrozen) {
      res.status(403).json({ message: user.frozenReason || 'This account has been suspended.' });
      return;
    }

    req.user = payload;
    // Awaited so a request that reads the user's own store/product state
    // right after this middleware (e.g. opening My Store) sees the lock
    // applied on the same request, not one request later. It's a cheap
    // no-op once already synced - only writes when the plan just lapsed.
    try {
      await syncStoreLockState(payload.id);
    } catch (err) {
      console.error('syncStoreLockState failed', err);
    }
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
  }
  next();
};


export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};