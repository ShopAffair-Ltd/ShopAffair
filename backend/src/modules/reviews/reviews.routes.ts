import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getSellerReviews,
  createReview,
  markReviewHelpful
} from './reviews.controller.js';

const router = Router();

router.get('/seller/:username', requireAuth, getSellerReviews);
router.post('/seller/:username', requireAuth, createReview);
router.post('/:reviewId/helpful', requireAuth, markReviewHelpful);

export default router;