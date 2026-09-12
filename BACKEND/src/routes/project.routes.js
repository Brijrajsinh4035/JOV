import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateStatus,
  deleteProject,
} from '../controllers/project.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getProjects)
  .post(verifyJWT, authorizeAdmin, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(verifyJWT, authorizeAdmin, updateProject)
  .delete(verifyJWT, authorizeAdmin, deleteProject);

router.patch('/:id/status', verifyJWT, updateStatus);

export default router;
