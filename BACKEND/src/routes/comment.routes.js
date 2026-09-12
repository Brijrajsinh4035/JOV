import { Router } from 'express';
import {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getComments)
  .post(verifyJWT, createComment);

router.route('/:id')
  .get(getCommentById)
  .put(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

export default router;
