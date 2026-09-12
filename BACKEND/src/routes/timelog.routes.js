import { Router } from 'express';
import {
  getTimelogs,
  getTimelogById,
  createTimelog,
  updateTimelog,
  deleteTimelog,
} from '../controllers/timelog.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(verifyJWT, getTimelogs)
  .post(verifyJWT, createTimelog);

router.route('/:id')
  .get(verifyJWT, getTimelogById)
  .put(verifyJWT, updateTimelog)
  .delete(verifyJWT, deleteTimelog);

export default router;
