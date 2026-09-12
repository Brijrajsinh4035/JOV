import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(verifyJWT, getAllUsers)
  .post(verifyJWT, authorizeAdmin, createUser);

router.route('/:id')
  .get(verifyJWT, getUserById)
  .put(verifyJWT, authorizeAdmin, updateUser)
  .delete(verifyJWT, authorizeAdmin, deleteUser);

export default router;
