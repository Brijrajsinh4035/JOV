import Milestone from '../models/milestone.model.js';
import Project from '../models/project.model.js';

export const normalizeMilestone = (m) => {
  if (!m) return m;
  const doc = typeof m.toObject === 'function' ? m.toObject() : { ...m };
  if (doc.projectId && typeof doc.projectId === 'object') {
    doc.projectId = {
      ...doc.projectId,
      name: doc.projectId.name || doc.projectId.title || 'Infrastructure Project',
      title: doc.projectId.title || doc.projectId.name || 'Infrastructure Project',
    };
  }
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    title: doc.title || 'Milestone Checkpoint',
    status: (doc.status || 'pending').toLowerCase().replace(' ', '-'),
    dueDate: doc.dueDate || doc.targetDate || null,
  };
};

export const milestoneDao = {
  findAll: async (query = {}) => {
    const list = await Milestone.find(query).sort({ dueDate: 1 }).populate('projectId', 'name title status').lean();
    return list.map(normalizeMilestone);
  },

  findById: async (id) => {
    const m = await Milestone.findById(id).populate('projectId', 'name title status').lean();
    return m ? normalizeMilestone(m) : null;
  },

  findByProject: async (projectId) => {
    const results = await Milestone.find({ projectId }).sort({ dueDate: 1 }).populate('projectId', 'name title status').lean();
    if (results.length > 0) return results.map(normalizeMilestone);

    const proj = await Project.findById(projectId).lean();
    if (proj && Array.isArray(proj.milestones) && proj.milestones.length > 0) {
      return proj.milestones.map((m) => normalizeMilestone({
        _id: m._id,
        id: m._id,
        projectId: {
          _id: proj._id,
          name: proj.name || proj.title,
          title: proj.title || proj.name,
          status: proj.status,
        },
        title: m.title,
        description: m.remarks || m.description || '',
        dueDate: m.targetDate || m.dueDate,
        status: (m.status || 'pending').toLowerCase().replace(' ', '-'),
        responsiblePerson: m.responsiblePerson,
      }));
    }
    return [];
  },

  create: async (data) => {
    return (await Milestone.create({ ...data, createdAt: data.createdAt || new Date() })).toObject();
  },

  update: async (id, updateData) => {
    return await Milestone.findByIdAndUpdate(id, updateData, { new: true }).lean();
  },

  delete: async (id) => {
    const res = await Milestone.findByIdAndDelete(id);
    return !!res;
  },
};

export default milestoneDao;
