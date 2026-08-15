import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import tradesRoutes from './modules/trades/trades.routes';
import usersRoutes from './modules/users/users.routes';
import wallPostsRoutes from './modules/wallPosts/wallPosts.routes';
import chatRoutes from './modules/chat/chat.routes';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import paymentsWebhooks from './modules/payments/payments.webhooks';
import notificationsRoutes from './modules/notifications/notifications.routes';

import adminRoutes from './modules/admin/admin.routes';
import supportRoutes from './modules/support/support.routes';
import settingsRoutes from './modules/settings/settings.routes';

export const createApp = (): Express => {
  const app = express();
  
  app.use(helmet());
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:5174', 'https://shops-lake.vercel.app'],
      credentials: true
    })
  );
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  
  app.use('/api/payments/webhooks', paymentsWebhooks);
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/trades', tradesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/users', wallPostsRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(errorMiddleware);

  return app;
};