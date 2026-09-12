import { Router } from 'express';
import {
  getAttachments,
  getAttachmentById,
  createAttachment,
  deleteAttachment,
} from '../controllers/attachment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getAttachments)
  .post(verifyJWT, createAttachment);

router.route('/:id')
  .get(getAttachmentById)
  .delete(verifyJWT, deleteAttachment);

export default router;
