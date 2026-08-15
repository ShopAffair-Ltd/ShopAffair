import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' }
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);

export default router;