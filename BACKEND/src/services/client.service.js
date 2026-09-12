import { clientDao } from '../dao/client.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const clientService = {
  getAll: async (query = {}) => {
    return await clientDao.findAll(query);
  },

  getById: async (id) => {
    const client = await clientDao.findById(id);
    if (!client) throw new ApiError(404, 'Client not found');
    return client;
  },

  create: async (data) => {
    if (!data.name || !data.email) {
      throw new ApiError(400, 'Client name and email are required');
    }
    const existing = await clientDao.findByEmail(data.email);
    if (existing) {
      throw new ApiError(409, 'Client with this email already exists');
    }
    return await clientDao.create(data);
  },

  update: async (id, updateData) => {
    const client = await clientDao.findById(id);
    if (!client) throw new ApiError(404, 'Client not found');
    return await clientDao.update(id, updateData);
  },

  delete: async (id) => {
    const client = await clientDao.findById(id);
    if (!client) throw new ApiError(404, 'Client not found');
    return await clientDao.delete(id);
  },
};

export default clientService;
