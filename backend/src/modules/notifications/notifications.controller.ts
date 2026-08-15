import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { listNotificationsQuerySchema, notificationIdParamSchema } from './notifications.validation';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from './notifications.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { page, limit } = listNotificationsQuerySchema.parse(req.query);
  const result = await listNotifications(user.id, page, limit);
  res.status(200).json(result);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = notificationIdParamSchema.parse(req.params);
  const notification = await markAsRead(user.id, id);
  res.status(200).json({ notification });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  await markAllAsRead(user.id);
  res.status(200).json({ success: true });
});

export const removeNotification = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = notificationIdParamSchema.parse(req.params);
  await deleteNotification(user.id, id);
  res.status(204).send();
});