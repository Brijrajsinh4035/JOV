import { departmentDao } from '../dao/department.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const departmentService = {
  getAll: async (query = {}) => {
    return await departmentDao.findAll(query);
  },

  getById: async (id) => {
    const dept = await departmentDao.findById(id);
    if (!dept) throw new ApiError(404, 'Department not found');
    return dept;
  },

  create: async (data) => {
    if (!data.name) throw new ApiError(400, 'Department name is required');
    return await departmentDao.create(data);
  },

  update: async (id, updateData) => {
    const dept = await departmentDao.findById(id);
    if (!dept) throw new ApiError(404, 'Department not found');
    return await departmentDao.update(id, updateData);
  },

  delete: async (id) => {
    const dept = await departmentDao.findById(id);
    if (!dept) throw new ApiError(404, 'Department not found');
    return await departmentDao.delete(id);
  },
};

export default departmentService;
