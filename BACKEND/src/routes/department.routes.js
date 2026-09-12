import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
  .get(getDepartments)
  .post(verifyJWT, authorizeAdmin, createDepartment);

router.route('/:id')
  .get(getDepartmentById)
  .put(verifyJWT, authorizeAdmin, updateDepartment)
  .delete(verifyJWT, authorizeAdmin, deleteDepartment);

export default router;
