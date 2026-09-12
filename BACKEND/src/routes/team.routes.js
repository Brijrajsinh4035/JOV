import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/team.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(verifyJWT, getTeams)
  .post(verifyJWT, authorizeAdmin, createTeam);

router.route('/:id')
  .get(verifyJWT, getTeamById)
  .put(verifyJWT, authorizeAdmin, updateTeam)
  .delete(verifyJWT, authorizeAdmin, deleteTeam);

export default router;
