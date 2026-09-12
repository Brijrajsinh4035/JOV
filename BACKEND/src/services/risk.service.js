import { riskDao } from '../dao/risk.dao.js';
import { projectDao } from '../dao/project.dao.js';
import { notificationDao } from '../dao/notification.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const riskService = {
  getAll: async (query = {}) => {
    return await riskDao.findAll(query);
  },

  getById: async (id) => {
    const risk = await riskDao.findById(id);
    if (!risk) throw new ApiError(404, 'Risk record not found');
    return risk;
  },

  create: async (data, userId) => {
    if (!data.projectId || !data.title) {
      throw new ApiError(400, 'projectId and title are required');
    }

    const project = await projectDao.findById(data.projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (data.severity && !validSeverities.includes(data.severity)) {
      throw new ApiError(400, `Invalid severity. Allowed: ${validSeverities.join(', ')}`);
    }

    const validStatuses = ['open', 'mitigated', 'closed'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new ApiError(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const created = await riskDao.create(data);

    if (created.severity === 'critical' || created.severity === 'high') {
      if (project.ownerId) {
        await notificationDao.create({
          userId: project.ownerId._id || project.ownerId,
          type: 'risk_alert',
          message: `High risk reported on "${project.name}": ${created.title}`,
        });
      }
    }

    return created;
  },

  update: async (id, updateData, userId) => {
    const existing = await riskDao.findById(id);
    if (!existing) throw new ApiError(404, 'Risk record not found');

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (updateData.severity && !validSeverities.includes(updateData.severity)) {
      throw new ApiError(400, `Invalid severity. Allowed: ${validSeverities.join(', ')}`);
    }

    const validStatuses = ['open', 'mitigated', 'closed'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new ApiError(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    return await riskDao.update(id, updateData);
  },

  delete: async (id, userId) => {
    const existing = await riskDao.findById(id);
    if (!existing) throw new ApiError(404, 'Risk record not found');
    return await riskDao.delete(id);
  },
};

export default riskService;
