import { dashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats();
  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Dashboard analytics retrieved successfully'));
});

export default {
  getDashboardStats,
};
