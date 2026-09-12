import { timelogDao } from '../dao/timelog.dao.js';
import { taskDao } from '../dao/task.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const timelogService = {
  getAll: async (query = {}) => {
    return await timelogDao.findAll(query);
  },

  getById: async (id) => {
    const log = await timelogDao.findById(id);
    if (!log) throw new ApiError(404, 'Timelog record not found');
    return log;
  },

  create: async (data, userId) => {
    if (!data.taskId || !data.hours) {
      throw new ApiError(400, 'taskId and hours are required');
    }
    const task = await taskDao.findById(data.taskId);
    if (!task) throw new ApiError(404, 'Referenced task does not exist');

    return await timelogDao.create({
      ...data,
      userId: userId || data.userId,
      hours: Number(data.hours),
    });
  },

  update: async (id, updateData, userId) => {
    const existing = await timelogDao.findById(id);
    if (!existing) throw new ApiError(404, 'Timelog record not found');
    return await timelogDao.update(id, updateData);
  },

  delete: async (id, userId) => {
    const existing = await timelogDao.findById(id);
    if (!existing) throw new ApiError(404, 'Timelog record not found');
    return await timelogDao.delete(id);
  },
};

export default timelogService;
