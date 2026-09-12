import { timelogService } from '../services/timelog.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getTimelogs = asyncHandler(async (req, res) => {
  const timelogs = await timelogService.getAll(req.query);
  return res.status(200).json(new ApiResponse(200, timelogs, 'Timelogs retrieved successfully'));
});

export const getTimelogById = asyncHandler(async (req, res) => {
  const log = await timelogService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, log, 'Timelog retrieved successfully'));
});

export const createTimelog = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const log = await timelogService.create(req.body, userId);
  return res.status(201).json(new ApiResponse(201, log, 'Timelog entry created successfully'));
});

export const updateTimelog = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const log = await timelogService.update(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, log, 'Timelog updated successfully'));
});

export const deleteTimelog = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await timelogService.delete(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Timelog deleted successfully'));
});

export default {
  getTimelogs,
  getTimelogById,
  createTimelog,
  updateTimelog,
  deleteTimelog,
};
