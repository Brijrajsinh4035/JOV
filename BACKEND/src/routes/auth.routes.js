import { Router } from 'express';
import { login, register, getProfile, logout } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', verifyJWT, getProfile);
router.post('/logout', verifyJWT, logout);

export default router;
