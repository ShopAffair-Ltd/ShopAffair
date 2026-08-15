import { z } from 'zod';

export const usernameParamSchema = z.object({
  username: z.string().min(1)
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid()
});

export const createWallPostSchema = z.object({
  content: z.string().min(1).max(2000)
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(1000)
});

export type CreateWallPostInput = z.infer<typeof createWallPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;