import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/db';
import type { AuthPayload } from '../types/express';

// Checking isFrozen on every authenticated request means a freeze takes
// effect immediately, even for someone already holding a valid JWT -
// without this, "fully locked out" would only apply to new logins, and a
// frozen user could keep trading/chatting until their token naturally
// expires (up to 7 days). The extra query is a deliberate tradeoff:
// correctness of an urgent moderation action over shaving one DB round trip.
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