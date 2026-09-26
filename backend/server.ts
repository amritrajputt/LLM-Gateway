import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { authRouter } from './src/module/auth/auth.route';
import { keysRouter } from './src/module/keys/keys.routes';
import { errorHandler } from './src/common/middleware/error.middleware';
import { guardRails } from './src/guardrails/guardRails';
import { db } from './src/index';
import { redisClient } from './src/redis/client';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(clerkMiddleware());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/query', guardRails);
app.use('/api/v1/keys', keysRouter);
// Global Error Handler
app.use(errorHandler);

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

let isShuttingDown = false;

async function graceFullShutDown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  const forceExitTimer = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    server.closeAllConnections();
    process.exit(1);
  }, 10000);

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await db.$client.end();
    await redisClient.quit();
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', graceFullShutDown);
process.on('SIGINT', graceFullShutDown);

