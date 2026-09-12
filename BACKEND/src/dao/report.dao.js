import Report from '../models/report.model.js';

export const reportDao = {
  findAll: async (query = {}) => {
    const filter = {};
    if (query.projectId) filter.projectId = query.projectId;
    if (query.type) filter.type = query.type;
    return await Report.find(filter)
      .populate('projectId', 'name status budget usedbudget')
      .populate('generatedBy', 'username email role')
      .sort({ generatedAt: -1 })
      .lean();
  },

  findById: async (id) => {
    return await Report.findById(id)
      .populate('projectId', 'name status budget usedbudget')
      .populate('generatedBy', 'username email role')
      .lean();
  },

  create: async (data) => {
    const created = await Report.create({
      ...data,
      generatedAt: data.generatedAt || new Date(),
    });
    return (
      await Report.findById(created._id)
        .populate('projectId', 'name status')
        .populate('generatedBy', 'username email')
    ).toObject();
  },

  delete: async (id) => {
    const res = await Report.findByIdAndDelete(id);
    return !!res;
  },
};

export default reportDao;
