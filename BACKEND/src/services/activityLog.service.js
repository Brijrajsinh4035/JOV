import { activityLogDao } from '../dao/activityLog.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const activityLogService = {
  getAll: async (query = {}, limit = 50) => {
    return await activityLogDao.findAll(query, limit);
  },

  create: async (data, userId) => {
    if (!data.action) throw new ApiError(400, 'Action is required');
    return await activityLogDao.create({
      ...data,
      userId: userId || data.userId,
    });
  },
};

export default activityLogService;
