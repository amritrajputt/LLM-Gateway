import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { authRouter } from './src/module/auth/auth.route';
import { errorHandler } from './src/common/middleware/error.middleware';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(clerkMiddleware());

app.use('/auth', authRouter);

// Global Error Handler
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

