import { Router } from 'express';
import { getStates, getStateById } from '../controllers/state.controller.js';

const router = Router();

router.get('/', getStates);
router.get('/:id', getStateById);

export default router;
