import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  checkoutSchema,
  updateOrderStatusSchema,
  listOrdersQuerySchema,
  orderIdParamSchema
} from './orders.validation';
import { checkout, listOrders, getOrderById, updateOrderStatus } from './orders.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = checkoutSchema.parse(req.body);
  const result = await checkout(user.id, input);
  res.status(201).json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await listOrders(user.id, query);
  res.status(200).json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = orderIdParamSchema.parse(req.params);
  const order = await getOrderById(id, user.id, user.role);
  res.status(200).json({ order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = orderIdParamSchema.parse(req.params);
  const { status } = updateOrderStatusSchema.parse(req.body);
  const order = await updateOrderStatus(id, user.id, user.role, status);
  res.status(200).json({ order });
});