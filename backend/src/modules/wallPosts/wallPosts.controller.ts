import { Request, Response, NextFunction } from 'express';
import * as wallPostsService from './wallPosts.service';
import {
  usernameParamSchema,
  postIdParamSchema,
  createWallPostSchema,
  createCommentSchema
} from './wallPosts.validation'

export const listWallPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = usernameParamSchema.parse(req.params);
    const posts = await wallPostsService.getWallPosts(username, req.user?.id);
    res.json({ posts });
  } catch (err) {
    next(err);
  }
};

export const createWallPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createWallPostSchema.parse(req.body);
    const post = await wallPostsService.createWallPost(req.user!.id, input);
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

export const deleteWallPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = postIdParamSchema.parse(req.params);
    const result = await wallPostsService.deleteWallPost(req.user!.id, postId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const togglePin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = postIdParamSchema.parse(req.params);
    const post = await wallPostsService.togglePin(req.user!.id, postId);
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = postIdParamSchema.parse(req.params);
    const post = await wallPostsService.toggleLike(req.user!.id, postId);
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId } = postIdParamSchema.parse(req.params);
    const input = createCommentSchema.parse(req.body);
    const post = await wallPostsService.addComment(req.user!.id, postId, input);
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};