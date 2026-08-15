import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { placeOrder, list, getOne, updateStatus } from './orders.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();


const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many checkout attempts, please slow down' }
});

router.post('/checkout', requireAuth, checkoutLimiter, placeOrder);
router.get('/', requireAuth, list);
router.get('/:id', requireAuth, getOne);
router.patch('/:id/status', requireAuth, updateStatus);

export default router;