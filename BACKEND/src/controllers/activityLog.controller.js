import { activityLogService } from '../services/activityLog.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { limit, userId, refType } = req.query;
  const logs = await activityLogService.getAll({ userId, refType }, limit);
  return res.status(200).json(new ApiResponse(200, logs, 'Activity logs retrieved successfully'));
});

export const createActivityLog = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const log = await activityLogService.create(req.body, userId);
  return res.status(201).json(new ApiResponse(201, log, 'Activity logged successfully'));
});

export default {
  getActivityLogs,
  createActivityLog,
};
