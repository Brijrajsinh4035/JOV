import app from './src/app.js';
import { envConfig } from './src/config/env.config.js';
import { connectDB } from './src/config/db.config.js';

const startServer = async () => {
  try {
    await connectDB();

    const PORT = envConfig.port || 5001;
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`[GOVERNMENT PORTAL BACKEND] Server running on PORT: ${PORT}`);
      console.log(`[API Base URL] http://localhost:${PORT}/api`);
      console.log(`[Health Check] http://localhost:${PORT}/api/health`);
      console.log(`[Environment] ${envConfig.nodeEnv}`);
      console.log('====================================================');
    });

    server.on('error', (err) => {
      console.error(`[Server Error] ${err.message}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.warn('[Unhandled Rejection]', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[Uncaught Exception]', err);
    });
  } catch (error) {
    console.error(`Failed to initialize server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

