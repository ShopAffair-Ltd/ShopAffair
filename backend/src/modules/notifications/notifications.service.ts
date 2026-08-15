import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { io } from '../../config/socket';
import type { NotificationType } from '../../generated/prisma/enums.js';

/**
 * Creates a notification for a user and pushes it to them live over their
 * personal socket room (`user:${userId}`, joined automatically on connect -
 * see config/socket.ts) if they're currently connected. This is the single
 * entry point other modules (trades, payments, orders, chat) should import
 * and call whenever something happens that the user should know about - it
 * deliberately does NOT throw on failure to the caller's main flow: if
 * writing a notification fails, that should never roll back or block the
 * real action (e.g. a successful escrow release should not fail just
 * because the notification insert had a hiccup). Errors are logged, not
 * propagated.
 */
export const notify = async (params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type ?? 'INFO'
      }
    });

    // io is undefined until initSocket() runs (e.g. in test/script contexts
    // that import this service without starting the HTTP+socket server) -
    // guard rather than assume it's always initialized.
    io?.to(`user:${params.userId}`).emit('new_notification', notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

export const listNotifications = async (userId: string, page: number, limit: number) => {
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } })
  ]);

  return {
    items,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw new ApiError(404, 'Notification not found');
  }

  await prisma.notification.delete({ where: { id: notificationId } });
};