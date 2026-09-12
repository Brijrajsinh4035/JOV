import express from 'express';
import cors from 'cors';
import { envConfig } from './config/env.config.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/apiError.util.js';
import apiRoutes from './routes/index.routes.js';

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development ports, Postman, Vite dev server
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));
app.use(requestLogger);

// Mount API Routes (Both /api/v1 and /api for compatibility)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Root information endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    platform: 'Government Integrated Project Monitoring Platform API',
    status: 'ACTIVE',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Fallback 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route '${req.originalUrl}' does not exist on this government portal API`));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
