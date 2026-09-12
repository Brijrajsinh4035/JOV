import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(verifyJWT, getClients)
  .post(verifyJWT, authorizeAdmin, createClient);

router.route('/:id')
  .get(verifyJWT, getClientById)
  .put(verifyJWT, authorizeAdmin, updateClient)
  .delete(verifyJWT, authorizeAdmin, deleteClient);

export default router;
