import { Router } from 'express';
import {
  getAllMilestones,
  getMilestonesByProject,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../controllers/milestone.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getAllMilestones)
  .post(verifyJWT, authorizeAdmin, createMilestone);

router.get('/project/:projectId', getMilestonesByProject);

router.route('/:id')
  .get(getMilestoneById)
  .put(verifyJWT, authorizeAdmin, updateMilestone)
  .delete(verifyJWT, authorizeAdmin, deleteMilestone);

export default router;
