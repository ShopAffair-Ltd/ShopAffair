import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification
} from './notifications.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.patch('/:id/read', requireAuth, markNotificationRead);
router.patch('/read-all', requireAuth, markAllNotificationsRead);
router.delete('/:id', requireAuth, removeNotification);

export default router;