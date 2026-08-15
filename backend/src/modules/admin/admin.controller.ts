import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { rejectCommunitySchema, freezeUserSchema } from './admin.validation';
import {
  listPendingCommunities,
  approveCommunity,
  rejectCommunity,
  freezeUser,
  unfreezeUser,
  listFrozenUsers,
  resumeTrade,
  listPendingKyc,
  approveKyc,
  rejectKyc,
  listAuditLogs,
  getDashboardOverview,
  listAllProducts,
  deleteProduct,
  listAllReviews,
  deleteReview,
  listAllOrders,
  listVendors,
  listProductCategories,
  getSystemHealth
} from './admin.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const getPendingCommunities = asyncHandler(async (_req: Request, res: Response) => {
  const communities = await listPendingCommunities();
  res.status(200).json({ communities });
});

export const approvePendingCommunity = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const chatRoom = await approveCommunity(chatRoomId, admin.id);
  res.status(200).json({ chatRoom });
});

export const rejectPendingCommunity = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const chatRoomId = req.params.chatRoomId as string;
  const { reason } = rejectCommunitySchema.parse(req.body);
  const chatRoom = await rejectCommunity(chatRoomId, admin.id, reason);
  res.status(200).json({ chatRoom });
});

export const freeze = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const userId = req.params.userId as string;
  const { reason } = freezeUserSchema.parse(req.body);
  const user = await freezeUser(userId, admin.id, reason);
  res.status(200).json({ user });
});

export const unfreeze = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const userId = req.params.userId as string;
  const user = await unfreezeUser(userId, admin.id);
  res.status(200).json({ user });
});

export const getFrozenUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listFrozenUsers();
  res.status(200).json({ users });
});

export const unpauseTrade = asyncHandler(async (req: Request, res: Response) => {
  const tradeId = req.params.tradeId as string;
  const trade = await resumeTrade(tradeId);
  res.status(200).json({ trade });
});

export const getPendingKycList = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listPendingKyc();
  res.status(200).json({ users });
});

export const approveKycUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await approveKyc(userId);
  res.status(200).json({ user });
});

export const rejectKycUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { reason } = rejectCommunitySchema.parse(req.body);
  const user = await rejectKyc(userId, reason);
  res.status(200).json({ user });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAuditLogs(page, limit);
  res.status(200).json(result);
});

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const overview = await getDashboardOverview();
  res.status(200).json(overview);
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllProducts(page, limit);
  res.status(200).json(result);
});

export const removeProduct = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  await deleteProduct(productId);
  res.status(204).send();
});

export const getAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllReviews(page, limit);
  res.status(200).json(result);
});

export const removeReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  await deleteReview(reviewId);
  res.status(204).send();
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listAllOrders(page, limit);
  res.status(200).json(result);
});

export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listVendors(page, limit);
  res.status(200).json(result);
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listProductCategories();
  res.status(200).json({ categories });
});

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const health = await getSystemHealth();
  res.status(200).json(health);
});