import { teamDao } from '../dao/team.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const teamService = {
  getAll: async (query = {}) => {
    return await teamDao.findAll(query);
  },

  getById: async (id) => {
    const team = await teamDao.findById(id);
    if (!team) throw new ApiError(404, 'Team not found');
    return team;
  },

  create: async (data) => {
    if (!data.name) throw new ApiError(400, 'Team name is required');
    return await teamDao.create(data);
  },

  update: async (id, updateData) => {
    const team = await teamDao.findById(id);
    if (!team) throw new ApiError(404, 'Team not found');
    return await teamDao.update(id, updateData);
  },

  delete: async (id) => {
    const team = await teamDao.findById(id);
    if (!team) throw new ApiError(404, 'Team not found');
    return await teamDao.delete(id);
  },
};

export default teamService;
