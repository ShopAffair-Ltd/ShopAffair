import { createServer } from 'http';
import { createApp } from './app';
import { initSocket } from './config/socket';
import { env } from './config/env';
import { prisma } from './config/db';

const start = async () => {
  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`ShopFair backend running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();