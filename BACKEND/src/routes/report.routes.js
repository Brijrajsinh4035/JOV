import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
  getSummaryReport,
  exportProjectsCSV,
} from '../controllers/report.controller.js';
import { verifyJWT, authorizeAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/summary', getSummaryReport);
router.get('/export/csv', exportProjectsCSV);

router.route('/')
  .get(getAllReports)
  .post(verifyJWT, createReport);

router.route('/:id')
  .get(getReportById)
  .delete(verifyJWT, authorizeAdmin, deleteReport);

export default router;
