import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import type { CreateWallPostInput, CreateCommentInput } from './wallPosts.validation';

const postWithRelations = (viewerId?: string) => ({
  include: {
    likes: viewerId ? { where: { userId: viewerId } } : false,
    comments: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        author: {
          select: { id: true, name: true, username: true, profilePicture: true }
        }
      }
    },
    _count: { select: { likes: true } }
  }
});

const getTrialAllowedEngagerIds = async (sellerId: string): Promise<Set<string>> => {
  const allComments = await prisma.wallPostComment.findMany({
    where: {
      post: { sellerId },
      authorId: { not: sellerId }
    },
    select: { authorId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const engagers = new Set<string>();
  for (const c of allComments) {
    if (engagers.size < 5) {
      engagers.add(c.authorId);
    }
  }
  return engagers;
};

const shapePost = (
  post: any,
  viewerId?: string,
  isTrialStore?: boolean,
  allowedEngagers?: Set<string>,
  sellerId?: string
) => {
  const isSeller = Boolean(viewerId && sellerId && viewerId === sellerId);

  const comments = (post.comments || [])
    .map((c: any) => {
      const isSellerAuthor = Boolean(sellerId && c.author.id === sellerId);
      const isPending = Boolean(
        isTrialStore &&
        !isSellerAuthor &&
        allowedEngagers &&
        !allowedEngagers.has(c.author.id)
      );

      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author,
        isPending
      };
    })
    .filter((c: any) => {
      if (!c.isPending) return true;
      // Pending comments are visible only to the store owner and the commenter themselves
      if (isSeller) return true;
      if (viewerId && c.author.id === viewerId) return true;
      return false;
    });

  return {
    id: post.id,
    content: post.content,
    isPinned: post.isPinned,
    createdAt: post.createdAt,
    likesCount: post._count.likes,
    likedByMe: viewerId ? post.likes.length > 0 : false,
    comments
  };
};

export const getWallPosts = async (username: string, viewerId?: string) => {
  const seller = await prisma.user.findUnique({
    where: { username },
    select: { id: true, isPro: true, storePlan: true }
  });
  if (!seller) {
    throw new ApiError(404, 'Store not found');
  }

  const isTrialStore = !seller.isPro || seller.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(seller.id) : undefined;

  const posts = await prisma.wallPost.findMany({
    where: { sellerId: seller.id },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    ...postWithRelations(viewerId)
  });

  return posts.map((p) => shapePost(p, viewerId, isTrialStore, allowedEngagers, seller.id));
};

export const createWallPost = async (sellerId: string, input: CreateWallPostInput) => {
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, isPro: true, storePlan: true }
  });
  const isTrialStore = !seller?.isPro || seller?.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(sellerId) : undefined;

  const post = await prisma.wallPost.create({
    data: { sellerId, content: input.content },
    ...postWithRelations(sellerId)
  });
  return shapePost(post, sellerId, isTrialStore, allowedEngagers, sellerId);
};

export const deleteWallPost = async (sellerId: string, postId: string) => {
  const post = await prisma.wallPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  if (post.sellerId !== sellerId) {
    throw new ApiError(403, 'You cannot delete this post');
  }
  await prisma.wallPost.delete({ where: { id: postId } });
  return { deleted: true };
};

export const togglePin = async (sellerId: string, postId: string) => {
  const post = await prisma.wallPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  if (post.sellerId !== sellerId) {
    throw new ApiError(403, 'You cannot pin this post');
  }
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, isPro: true, storePlan: true }
  });
  const isTrialStore = !seller?.isPro || seller?.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(sellerId) : undefined;

  const updated = await prisma.wallPost.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
    ...postWithRelations(sellerId)
  });
  return shapePost(updated, sellerId, isTrialStore, allowedEngagers, sellerId);
};

export const toggleLike = async (userId: string, postId: string) => {
  const post = await prisma.wallPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const existing = await prisma.wallPostLike.findUnique({
    where: { postId_userId: { postId, userId } }
  });

  if (existing) {
    await prisma.wallPostLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.wallPostLike.create({ data: { postId, userId } });
  }

  const seller = await prisma.user.findUnique({
    where: { id: post.sellerId },
    select: { id: true, isPro: true, storePlan: true }
  });
  const isTrialStore = !seller?.isPro || seller?.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(post.sellerId) : undefined;

  const updated = await prisma.wallPost.findUnique({
    where: { id: postId },
    ...postWithRelations(userId)
  });
  return shapePost(updated, userId, isTrialStore, allowedEngagers, post.sellerId);
};

export const addComment = async (userId: string, postId: string, input: CreateCommentInput) => {
  const post = await prisma.wallPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  const isBlocked = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: post.sellerId, blockedId: userId } }
  });
  if (isBlocked) {
    throw new ApiError(403, 'You have been blocked from commenting on this store');
  }

  await prisma.wallPostComment.create({
    data: { postId, authorId: userId, content: input.content }
  });

  const seller = await prisma.user.findUnique({
    where: { id: post.sellerId },
    select: { id: true, isPro: true, storePlan: true }
  });
  const isTrialStore = !seller?.isPro || seller?.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(post.sellerId) : undefined;

  const updated = await prisma.wallPost.findUnique({
    where: { id: postId },
    ...postWithRelations(userId)
  });
  return shapePost(updated, userId, isTrialStore, allowedEngagers, post.sellerId);
};

// Only the sender of the comment alone (or admin) can delete their comment
export const deleteComment = async (commentId: string, currentUserId: string) => {
  const comment = await prisma.wallPostComment.findUnique({
    where: { id: commentId },
    select: { postId: true, authorId: true, post: { select: { sellerId: true } } }
  });
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true }
  });

  if (comment.authorId !== currentUserId && currentUser?.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  await prisma.wallPostComment.delete({ where: { id: commentId } });

  const sellerId = comment.post.sellerId;
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, isPro: true, storePlan: true }
  });
  const isTrialStore = !seller?.isPro || seller?.storePlan === 'TRIAL';
  const allowedEngagers = isTrialStore ? await getTrialAllowedEngagerIds(sellerId) : undefined;

  const updated = await prisma.wallPost.findUnique({
    where: { id: comment.postId },
    ...postWithRelations(currentUserId)
  });
  return shapePost(updated, currentUserId, isTrialStore, allowedEngagers, sellerId);
};