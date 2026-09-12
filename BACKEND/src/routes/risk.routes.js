import { Router } from 'express';
import {
  getRisks,
  getRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
} from '../controllers/risk.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getRisks)
  .post(verifyJWT, createRisk);

router.route('/:id')
  .get(getRiskById)
  .put(verifyJWT, updateRisk)
  .delete(verifyJWT, authorizeAdmin, deleteRisk);

export default router;
