import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { startDraft, resolveAccount, updateDraft, confirmDraft, login, me } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' }
});


const resolveAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many account verification attempts, please try again later' }
});

router.post('/register/start', startDraft);
router.post('/register/resolve-account', resolveAccountLimiter, resolveAccount);
router.post('/register/update', updateDraft);
router.post('/register/confirm', confirmDraft);
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);

export default router;