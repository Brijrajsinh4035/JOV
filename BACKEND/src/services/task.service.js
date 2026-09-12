import { taskDao } from '../dao/task.dao.js';
import { projectDao } from '../dao/project.dao.js';
import { notificationDao } from '../dao/notification.dao.js';
import { activityLogDao } from '../dao/activityLog.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const taskService = {
  getAllTasks: async (query = {}) => {
    return await taskDao.findAll(query);
  },

  getTaskById: async (id) => {
    const task = await taskDao.findById(id);
    if (!task) throw new ApiError(404, `Task with ID '${id}' not found`);
    return task;
  },

  createTask: async (data, userId) => {
    if (!data.title || !data.projectId) {
      throw new ApiError(400, 'title and projectId are required');
    }

    const project = await projectDao.findById(data.projectId);
    if (!project) {
      throw new ApiError(404, `Project with ID '${data.projectId}' not found`);
    }

    const validStatuses = ['todo', 'in-progress', 'review', 'done', 'blocked'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new ApiError(400, `Invalid task status. Allowed: ${validStatuses.join(', ')}`);
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new ApiError(400, `Invalid task priority. Allowed: ${validPriorities.join(', ')}`);
    }

    const created = await taskDao.create(data);

    if (data.assignedTo) {
      await notificationDao.create({
        userId: data.assignedTo,
        type: 'task_assigned',
        message: `You have been assigned to task: "${created.title}"`,
      });
    }

    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Created task "${created.title}"`,
        refType: 'task',
        refId: created._id || created.id,
      });
    }

    return created;
  },

  updateTask: async (id, updateData, userId) => {
    const existing = await taskDao.findById(id);
    if (!existing) throw new ApiError(404, `Task with ID '${id}' not found`);

    const validStatuses = ['todo', 'in-progress', 'review', 'done', 'blocked'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new ApiError(400, `Invalid task status. Allowed: ${validStatuses.join(', ')}`);
    }

    const updated = await taskDao.update(id, updateData);

    if (updateData.assignedTo && String(updateData.assignedTo) !== String(existing.assignedTo?._id || existing.assignedTo)) {
      await notificationDao.create({
        userId: updateData.assignedTo,
        type: 'task_assigned',
        message: `You were assigned to task: "${updated.title}"`,
      });
    }

    return updated;
  },

  deleteTask: async (id, userId) => {
    const existing = await taskDao.findById(id);
    if (!existing) throw new ApiError(404, `Task with ID '${id}' not found`);
    return await taskDao.delete(id);
  },
};

export default taskService;
