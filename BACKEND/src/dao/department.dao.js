import Department from '../models/department.model.js';

export const departmentDao = {
  findAll: async (query = {}) => {
    return await Department.find(query).sort({ name: 1 }).lean();
  },

  findById: async (id) => {
    return await Department.findById(id).lean();
  },

  create: async (data) => {
    return (await Department.create({ ...data, createdAt: data.createdAt || new Date() })).toObject();
  },

  update: async (id, updateData) => {
    return await Department.findByIdAndUpdate(id, updateData, { new: true }).lean();
  },

  delete: async (id) => {
    const res = await Department.findByIdAndDelete(id);
    return !!res;
  },
};

export default departmentDao;
