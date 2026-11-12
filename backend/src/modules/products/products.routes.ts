import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { create, list, getOne, update, remove, landingSummary } from './products.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' }
});

// Public reads
router.get('/landing-summary', landingSummary);
router.get('/', list);
router.get('/:id', getOne);

// Authenticated writes 
router.post('/', requireAuth, writeLimiter, create);
router.patch('/:id', requireAuth, writeLimiter, update);
router.delete('/:id', requireAuth, writeLimiter, remove);

export default router;