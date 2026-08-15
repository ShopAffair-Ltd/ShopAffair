import { api } from './api';

export interface Review {
  id: string;
  reviewerName: string;
  reviewerUsername: string;
  rating: number;
  content: string;
  date: string;
  helpful: number;
  isHelpful?: boolean;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  totalSales: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  distribution: RatingDistribution[];
  stats: ReviewStats;
}

export interface CreateReviewInput {
  rating: number;
  content: string;
  orderId?: string;
}

export const reviewService = {
  getSellerReviews: (username: string) =>
    api.get<ReviewsResponse>(`/reviews/seller/${username}`),

  createReview: (username: string, data: CreateReviewInput) =>
    api.post<{ review: Review }>(`/reviews/seller/${username}`, data),

  markHelpful: (reviewId: string) =>
    api.post<{ helpful: boolean; count: number }>(`/reviews/${reviewId}/helpful`)
};