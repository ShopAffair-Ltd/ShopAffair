import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  createTradeSchema,
  editTradeSchema,
  updateTradeStatusSchema,
  listTradesQuerySchema,
  tradeIdParamSchema,
  verifyPickupCodeSchema
} from './trades.validation';
import {
  createTrade,
  editTrade,
  cancelOwnTrade,
  listTrades,
  getTradeById,
  fundTrade,
  verifyPickupCode,
  updateTradeStatus,
  forceCancelTrade
} from './trades.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = createTradeSchema.parse(req.body);
  const trade = await createTrade(user.id, input);
  res.status(201).json({ trade });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = listTradesQuerySchema.parse(req.query);
  const result = await listTrades(req.user?.id ?? null, query);
  res.status(200).json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = tradeIdParamSchema.parse(req.params);
  const trade = await getTradeById(id, req.user?.id ?? null);
  res.status(200).json({ trade });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = tradeIdParamSchema.parse(req.params);
  const input = editTradeSchema.parse(req.body);
  const trade = await editTrade(id, user.id, input);
  res.status(200).json({ trade });
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = tradeIdParamSchema.parse(req.params);
  const trade = await cancelOwnTrade(id, user.id);
  res.status(200).json({ trade });
});

export const fund = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = tradeIdParamSchema.parse(req.params);
  const trade = await fundTrade(id, user.id);
  res.status(200).json({ trade });
});

export const verifyPickup = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = tradeIdParamSchema.parse(req.params);
  const { code } = verifyPickupCodeSchema.parse(req.body);
  const trade = await verifyPickupCode(id, user.id, code);
  res.status(200).json({ trade });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = tradeIdParamSchema.parse(req.params);
  const { status } = updateTradeStatusSchema.parse(req.body);
  const trade = await updateTradeStatus(id, user.id, user.role, status);
  res.status(200).json({ trade });
});

export const forceCancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = tradeIdParamSchema.parse(req.params);
  const trade = await forceCancelTrade(id);
  res.status(200).json({ trade });
});