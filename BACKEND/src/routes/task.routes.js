import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getTasks)
  .post(verifyJWT, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(verifyJWT, updateTask)
  .delete(verifyJWT, authorizeAdmin, deleteTask);

export default router;
