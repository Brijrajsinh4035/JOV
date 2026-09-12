import Timelog from '../models/timelog.model.js';

export const timelogDao = {
  findAll: async (query = {}) => {
    return await Timelog.find(query)
      .populate('taskId', 'title projectId')
      .populate('userId', 'username email')
      .sort({ date: -1 })
      .lean();
  },

  findById: async (id) => {
    return await Timelog.findById(id)
      .populate('taskId', 'title projectId')
      .populate('userId', 'username email')
      .lean();
  },

  create: async (data) => {
    const created = await Timelog.create({ ...data, date: data.date ? new Date(data.date) : new Date() });
    return (await Timelog.findById(created._id).populate('taskId', 'title').populate('userId', 'username email')).toObject();
  },

  update: async (id, updateData) => {
    return await Timelog.findByIdAndUpdate(id, updateData, { new: true })
      .populate('taskId', 'title')
      .populate('userId', 'username email')
      .lean();
  },

  delete: async (id) => {
    const res = await Timelog.findByIdAndDelete(id);
    return !!res;
  },
};

export default timelogDao;
