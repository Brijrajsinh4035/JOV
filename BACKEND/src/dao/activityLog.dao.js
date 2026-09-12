import ActivityLog from '../models/activityLog.model.js';

export const activityLogDao = {
  findAll: async (query = {}, limit = 50) => {
    return await ActivityLog.find(query)
      .populate('userId', 'username email role')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
  },

  create: async (data) => {
    const created = await ActivityLog.create({
      ...data,
      createdAt: data.createdAt || new Date(),
    });
    return (await ActivityLog.findById(created._id).populate('userId', 'username email role')).toObject();
  },
};

export default activityLogDao;
