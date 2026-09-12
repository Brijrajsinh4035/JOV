import Risk from '../models/risk.model.js';

export const normalizeRisk = (r) => {
  if (!r) return r;
  const doc = typeof r.toObject === 'function' ? r.toObject() : { ...r };
  if (doc.projectId && typeof doc.projectId === 'object') {
    doc.projectId = {
      ...doc.projectId,
      name: doc.projectId.name || doc.projectId.title || 'Infrastructure Scheme',
      title: doc.projectId.title || doc.projectId.name || 'Infrastructure Scheme',
    };
  }
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
  };
};

export const riskDao = {
  findAll: async (query = {}) => {
    const filter = {};
    if (query.projectId) filter.projectId = query.projectId;
    if (query.severity) filter.severity = query.severity;
    if (query.status) filter.status = query.status;

    const list = await Risk.find(filter)
      .populate('projectId', 'name title status')
      .sort({ createdAt: -1 })
      .lean();
    return list.map(normalizeRisk);
  },

  findById: async (id) => {
    const r = await Risk.findById(id).populate('projectId', 'name title status').lean();
    return r ? normalizeRisk(r) : null;
  },

  create: async (data) => {
    const created = await Risk.create({ ...data, createdAt: data.createdAt || new Date() });
    const r = await Risk.findById(created._id).populate('projectId', 'name title status').lean();
    return normalizeRisk(r);
  },

  update: async (id, updateData) => {
    const updated = await Risk.findByIdAndUpdate(id, updateData, { new: true })
      .populate('projectId', 'name status')
      .lean();
    return updated ? normalizeRisk(updated) : null;
  },

  delete: async (id) => {
    const res = await Risk.findByIdAndDelete(id);
    return !!res;
  },
};

export default riskDao;
