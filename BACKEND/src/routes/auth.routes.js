import { Router } from 'express';
import {
  login,
  register,
  getProfile,
  logout,
  sendMobileOtp,
  verifyMobileOtp,
  resendMobileOtp,
  verifyWidgetAuth,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Standard Email/Password Auth
router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyJWT, getProfile);
router.post('/logout', verifyJWT, logout);

// MSG91 Mobile OTP Auth
router.post('/mobile/send-otp', sendMobileOtp);
router.post('/mobile/verify-otp', verifyMobileOtp);
router.post('/mobile/resend-otp', resendMobileOtp);
router.post('/mobile/verify-widget', verifyWidgetAuth);

// Direct aliases
router.post('/send-otp', sendMobileOtp);
router.post('/verify-otp', verifyMobileOtp);
router.post('/resend-otp', resendMobileOtp);
router.post('/verify-widget', verifyWidgetAuth);

export default router;

