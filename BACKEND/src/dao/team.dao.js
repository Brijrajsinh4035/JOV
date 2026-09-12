import Team from '../models/team.model.js';

export const teamDao = {
  findAll: async (query = {}) => {
    return await Team.find(query)
      .populate('members', 'username email role')
      .populate('departmentId', 'name')
      .lean();
  },

  findById: async (id) => {
    return await Team.findById(id)
      .populate('members', 'username email role')
      .populate('departmentId', 'name')
      .lean();
  },

  create: async (data) => {
    const created = await Team.create({ ...data, createdAt: data.createdAt || new Date() });
    return (await Team.findById(created._id).populate('members', 'username email role').populate('departmentId', 'name')).toObject();
  },

  update: async (id, updateData) => {
    return await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('members', 'username email role')
      .populate('departmentId', 'name')
      .lean();
  },

  delete: async (id) => {
    const res = await Team.findByIdAndDelete(id);
    return !!res;
  },
};

export default teamDao;
