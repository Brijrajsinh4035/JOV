import { riskService } from '../services/risk.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getRisks = asyncHandler(async (req, res) => {
  const risks = await riskService.getAll(req.query);
  return res.status(200).json(new ApiResponse(200, risks, 'Risks retrieved successfully'));
});

export const getRiskById = asyncHandler(async (req, res) => {
  const risk = await riskService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, risk, 'Risk retrieved successfully'));
});

export const createRisk = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const risk = await riskService.create(req.body, userId);
  return res.status(201).json(new ApiResponse(201, risk, 'Risk registered successfully'));
});

export const updateRisk = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const risk = await riskService.update(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, risk, 'Risk updated successfully'));
});

export const deleteRisk = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await riskService.delete(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Risk removed successfully'));
});

export default {
  getRisks,
  getRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
};
