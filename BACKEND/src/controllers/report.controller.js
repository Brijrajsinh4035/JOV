import { reportService } from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getAllReports(req.query);
  return res.status(200).json(new ApiResponse(200, reports, 'Reports retrieved successfully'));
});

export const getReportById = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(req.params.id);
  return res.status(200).json(new ApiResponse(200, report, 'Report retrieved successfully'));
});

export const createReport = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const report = await reportService.createReport(req.body, userId);
  return res.status(201).json(new ApiResponse(201, report, 'Report generated successfully'));
});

export const deleteReport = asyncHandler(async (req, res) => {
  await reportService.deleteReport(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Report deleted successfully'));
});

export const getSummaryReport = asyncHandler(async (req, res) => {
  const report = await reportService.getSummaryReport();
  return res.status(200).json(new ApiResponse(200, report, 'Summary report generated successfully'));
});

export const exportProjectsCSV = asyncHandler(async (req, res) => {
  const csvData = await reportService.getProjectsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="government_projects_report.csv"');
  return res.status(200).send(csvData);
});

export default {
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
  getSummaryReport,
  exportProjectsCSV,
};
