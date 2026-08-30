import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.middleware';
import { follow, unfollow, checkFollowing, getMyFollowers, getCounts } from './follow.controller';

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' }
});

router.get('/me/followers', requireAuth, getMyFollowers);
router.get('/:userId/counts', getCounts);
router.get('/:userId/is-following', requireAuth, checkFollowing);
router.post('/:userId', requireAuth, writeLimiter, follow);
router.delete('/:userId', requireAuth, writeLimiter, unfollow);

export default router;
