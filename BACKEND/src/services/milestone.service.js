import { milestoneDao } from '../dao/milestone.dao.js';
import { projectDao } from '../dao/project.dao.js';
import { activityLogDao } from '../dao/activityLog.dao.js';
import { notificationDao } from '../dao/notification.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const milestoneService = {
  getAllMilestones: async (query = {}) => {
    return await milestoneDao.findAll(query);
  },

  getMilestonesByProject: async (projectId) => {
    return await milestoneDao.findByProject(projectId);
  },

  getMilestoneById: async (id) => {
    const milestone = await milestoneDao.findById(id);
    if (!milestone) {
      throw new ApiError(404, `Milestone with ID '${id}' not found`);
    }
    return milestone;
  },

  createMilestone: async (data, userId) => {
    if (!data.projectId || !data.title || !data.dueDate) {
      throw new ApiError(400, 'projectId, title, and dueDate are required');
    }

    const project = await projectDao.findById(data.projectId);
    if (!project) {
      throw new ApiError(404, `Associated project with ID '${data.projectId}' does not exist`);
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'delayed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new ApiError(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const created = await milestoneDao.create(data);

    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Added milestone "${created.title}" to project`,
        refType: 'milestone',
        refId: created._id || created.id,
      });
    }

    return created;
  },

  updateMilestone: async (id, updateData, userId) => {
    const existing = await milestoneDao.findById(id);
    if (!existing) {
      throw new ApiError(404, `Milestone with ID '${id}' not found`);
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'delayed'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new ApiError(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const updated = await milestoneDao.update(id, updateData);

    if (userId && updateData.status === 'completed') {
      await notificationDao.create({
        userId,
        type: 'milestone',
        message: `Milestone "${updated.title}" was marked as completed.`,
      });
    }

    return updated;
  },

  deleteMilestone: async (id, userId) => {
    const existing = await milestoneDao.findById(id);
    if (!existing) {
      throw new ApiError(404, `Milestone with ID '${id}' not found`);
    }
    return await milestoneDao.delete(id);
  },
};

export default milestoneService;
