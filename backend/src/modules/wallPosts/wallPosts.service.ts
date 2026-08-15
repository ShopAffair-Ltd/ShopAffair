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

const shapePost = (post: any, viewerId?: string) => ({
  id: post.id,
  content: post.content,
  isPinned: post.isPinned,
  createdAt: post.createdAt,
  likesCount: post._count.likes,
  likedByMe: viewerId ? post.likes.length > 0 : false,
  comments: post.comments.map((c: any) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: c.author
  }))
});

export const getWallPosts = async (username: string, viewerId?: string) => {
  const seller = await prisma.user.findUnique({ where: { username } });
  if (!seller) {
    throw new ApiError(404, 'Store not found');
  }

  const posts = await prisma.wallPost.findMany({
    where: { sellerId: seller.id },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    ...postWithRelations(viewerId)
  });

  return posts.map((p) => shapePost(p, viewerId));
};

export const createWallPost = async (sellerId: string, input: CreateWallPostInput) => {
  const post = await prisma.wallPost.create({
    data: { sellerId, content: input.content },
    ...postWithRelations(sellerId)
  });
  return shapePost(post, sellerId);
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
  const updated = await prisma.wallPost.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
    ...postWithRelations(sellerId)
  });
  return shapePost(updated, sellerId);
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

  const updated = await prisma.wallPost.findUnique({
    where: { id: postId },
    ...postWithRelations(userId)
  });
  return shapePost(updated, userId);
};

export const addComment = async (userId: string, postId: string, input: CreateCommentInput) => {
  const post = await prisma.wallPost.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  await prisma.wallPostComment.create({
    data: { postId, authorId: userId, content: input.content }
  });

  const updated = await prisma.wallPost.findUnique({
    where: { id: postId },
    ...postWithRelations(userId)
  });
  return shapePost(updated, userId);
};