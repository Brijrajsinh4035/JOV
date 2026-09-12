import mongoose from 'mongoose';
import { envConfig } from './env.config.js';

export const connectDB = async () => {
  try {
    if (envConfig.mongoUri) {
      const conn = await mongoose.connect(envConfig.mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
      return true;
    }
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to ${envConfig.mongoUri}: ${error.message}`);
    console.warn('[MongoDB] Running with graceful database fallback.');
    return false;
  }
};

export default connectDB;
