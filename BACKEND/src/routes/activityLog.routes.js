import { Router } from 'express';
import {
  getActivityLogs,
  createActivityLog,
} from '../controllers/activityLog.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(verifyJWT, getActivityLogs)
  .post(verifyJWT, createActivityLog);

export default router;
