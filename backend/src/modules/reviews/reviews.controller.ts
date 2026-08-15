import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import * as reviewService from './reviews.service.js';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const getSellerReviews = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const username = req.params.username as string;

  const result = await reviewService.getSellerReviews(username, user.id);
  res.status(200).json(result);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const username = req.params.username as string;
  const { rating, content, orderId } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, 'Review content is required');
  }

  const review = await reviewService.createReview(user.id, username, rating, content, orderId);
  res.status(201).json({ review });
});

export const markReviewHelpful = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const reviewId = req.params.reviewId as string;

  const result = await reviewService.markReviewHelpful(reviewId, user.id);
  res.status(200).json(result);
});