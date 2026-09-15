import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { authRouter } from './src/module/auth/auth.route';
import { keysRouter } from './src/module/keys/keys.routes';
import { errorHandler } from './src/common/middleware/error.middleware';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(clerkMiddleware());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/keys', keysRouter);
// Global Error Handler
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

