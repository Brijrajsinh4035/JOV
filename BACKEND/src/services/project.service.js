import { projectDao } from '../dao/project.dao.js';
import { activityLogDao } from '../dao/activityLog.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const projectService = {
  getAllProjects: async (queryParams = {}) => {
    return await projectDao.findAll(queryParams);
  },

  getProjectById: async (id) => {
    const project = await projectDao.findById(id);
    if (!project) {
      throw new ApiError(404, `Project with ID '${id}' not found`);
    }
    return project;
  },

  createProject: async (projectData, userId) => {
    if (!projectData.name) {
      throw new ApiError(400, 'Project name is required');
    }

    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    if (projectData.status && !validStatuses.includes(projectData.status)) {
      throw new ApiError(
        400,
        `Invalid status '${projectData.status}'. Allowed: ${validStatuses.join(', ')}`
      );
    }

    const projectPayload = {
      ...projectData,
      ownerId: userId || projectData.ownerId,
      status: projectData.status || 'planning',
      budget: Number(projectData.budget || 0),
      usedbudget: Number(projectData.usedbudget || 0),
    };

    const newProject = await projectDao.create(projectPayload);

    // Audit log
    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Created new project "${newProject.name}"`,
        refType: 'project',
        refId: newProject._id || newProject.id,
      });
    }

    return newProject;
  },

  updateProject: async (id, updateData, userId) => {
    const existing = await projectDao.findById(id);
    if (!existing) {
      throw new ApiError(404, `Project with ID '${id}' not found`);
    }

    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    if (updateData.status && !validStatuses.includes(updateData.status)) {
      throw new ApiError(
        400,
        `Invalid status '${updateData.status}'. Allowed: ${validStatuses.join(', ')}`
      );
    }

    const updated = await projectDao.update(id, updateData);

    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Updated project "${updated.name}" details`,
        refType: 'project',
        refId: id,
      });
    }

    return updated;
  },

  updateProjectStatus: async (id, status, userId) => {
    const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status '${status}'. Allowed: ${validStatuses.join(', ')}`);
    }

    const existing = await projectDao.findById(id);
    if (!existing) {
      throw new ApiError(404, `Project with ID '${id}' not found`);
    }

    const updated = await projectDao.update(id, { status });

    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Changed status of "${updated.name}" to ${status}`,
        refType: 'project',
        refId: id,
      });
    }

    return updated;
  },

  deleteProject: async (id, userId) => {
    const existing = await projectDao.findById(id);
    if (!existing) {
      throw new ApiError(404, `Project with ID '${id}' not found`);
    }

    const deleted = await projectDao.delete(id);

    if (userId) {
      await activityLogDao.create({
        userId,
        action: `Deleted project "${existing.name}"`,
        refType: 'project',
        refId: id,
      });
    }

    return deleted;
  },
};

export default projectService;
