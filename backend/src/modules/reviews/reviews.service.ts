import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export const getSellerReviews = async (username: string, currentUserId: string) => {
  const seller = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      rating: true,
      reviewsCount: true,
      totalSales: true
    }
  });

  if (!seller) {
    throw new ApiError(404, 'Seller not found');
  }

  const reviews = await prisma.review.findMany({
    where: { sellerId: seller.id },
    include: {
      reviewer: {
        select: {
          name: true,
          username: true,
          avatarColor: true,
          profilePicture: true
        }
      },
      helpfulVotes: {
        where: { userId: currentUserId },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalReviews = reviews.length;
  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return {
      rating: star,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    };
  });

  const formattedReviews = reviews.map(r => ({
    id: r.id,
    reviewerName: r.reviewer.name,
    reviewerUsername: r.reviewer.username,
    rating: r.rating,
    content: r.content,
    date: r.createdAt.toISOString(),
    helpful: r.helpfulCount,
    isHelpful: r.helpfulVotes.length > 0
  }));

  return {
    reviews: formattedReviews,
    distribution,
    stats: {
      averageRating: seller.rating || 0,
      totalReviews: seller.reviewsCount || 0,
      totalSales: seller.totalSales || 0
    }
  };
};

export const createReview = async (
  reviewerId: string,
  username: string,
  rating: number,
  content: string,
  orderId?: string
) => {
  const seller = await prisma.user.findUnique({
    where: { username }
  });

  if (!seller) {
    throw new ApiError(404, 'Seller not found');
  }

  if (seller.id === reviewerId) {
    throw new ApiError(400, 'You cannot review yourself');
  }

  const existing = await prisma.review.findFirst({
    where: {
      reviewerId,
      sellerId: seller.id,
      orderId: orderId || undefined
    }
  });

  if (existing) {
    throw new ApiError(400, 'You have already reviewed this seller');
  }

  const review = await prisma.review.create({
    data: {
      reviewerId,
      sellerId: seller.id,
      rating,
      content,
      orderId
    },
    include: {
      reviewer: {
        select: {
          name: true,
          username: true,
          avatarColor: true,
          profilePicture: true
        }
      }
    }
  });

  const allReviews = await prisma.review.findMany({
    where: { sellerId: seller.id },
    select: { rating: true }
  });

  const totalReviews = allReviews.length;
  const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  await prisma.user.update({
    where: { id: seller.id },
    data: {
      rating: averageRating,
      reviewsCount: totalReviews
    }
  });

  return {
    id: review.id,
    reviewerName: review.reviewer.name,
    reviewerUsername: review.reviewer.username,
    rating: review.rating,
    content: review.content,
    date: review.createdAt.toISOString(),
    helpful: 0,
    isHelpful: false
  };
};

export const markReviewHelpful = async (reviewId: string, userId: string) => {
  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId
      }
    }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId
          }
        }
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } }
      })
    ]);
    return { helpful: false, count: await getHelpfulCount(reviewId) };
  }

  await prisma.$transaction([
    prisma.reviewHelpful.create({
      data: {
        reviewId,
        userId
      }
    }),
    prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } }
    })
  ]);

  return { helpful: true, count: await getHelpfulCount(reviewId) };
};

const getHelpfulCount = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { helpfulCount: true }
  });
  return review?.helpfulCount || 0;
};