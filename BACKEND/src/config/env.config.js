import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envConfig = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  mongoUri: process.env.MONGODB_URI,
  msg91AuthKey: process.env.MSG91_AUTH_KEY,
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
  msg91OtpLength: Number(process.env.MSG91_OTP_LENGTH),
  msg91OtpExpiry: Number(process.env.MSG91_OTP_EXPIRY),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
};

export default envConfig;
