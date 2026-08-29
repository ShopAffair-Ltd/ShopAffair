import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { create, update, cancel, list, getOne, fund, verifyPickup, updateStatus, forceCancel } from './trades.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' }
});

const pickupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many pickup verification attempts, please slow down' }
});

router.get('/', list);
router.get('/:id', getOne);

router.post('/', requireAuth, writeLimiter, create);
router.patch('/:id', requireAuth, writeLimiter, update);
router.post('/:id/cancel', requireAuth, writeLimiter, cancel);
router.post('/:id/fund', requireAuth, writeLimiter, fund);
router.post('/:id/verify-pickup', requireAuth, pickupLimiter, verifyPickup);
router.patch('/:id/status', requireAuth, writeLimiter, updateStatus);
router.post('/:id/force-cancel', requireAuth, requireRole('admin'), forceCancel);

export default router;