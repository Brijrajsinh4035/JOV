import Task from '../models/task.model.js';

export const normalizeTask = (t) => {
  if (!t) return t;
  const doc = typeof t.toObject === 'function' ? t.toObject() : { ...t };
  if (doc.projectId && typeof doc.projectId === 'object') {
    doc.projectId = {
      ...doc.projectId,
      name: doc.projectId.name || doc.projectId.title || 'Infrastructure Project',
      title: doc.projectId.title || doc.projectId.name || 'Infrastructure Project',
    };
  }
  if (doc.assignedTo && typeof doc.assignedTo === 'object') {
    doc.assignedTo = {
      ...doc.assignedTo,
      username: doc.assignedTo.username || doc.assignedTo.name || 'Assigned Officer',
      name: doc.assignedTo.name || doc.assignedTo.username || 'Assigned Officer',
    };
  }
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
  };
};

export const taskDao = {
  findAll: async (query = {}) => {
    const filter = {};
    if (query.projectId) filter.projectId = query.projectId;
    if (query.milestoneId) filter.milestoneId = query.milestoneId;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const list = await Task.find(filter)
      .populate('assignedTo', 'username name email role')
      .populate('milestoneId', 'title status dueDate')
      .populate('projectId', 'name title status')
      .sort({ dueDate: 1, updatedAt: -1 })
      .lean();
    return list.map(normalizeTask);
  },

  findById: async (id) => {
    const t = await Task.findById(id)
      .populate('assignedTo', 'username name email role')
      .populate('milestoneId', 'title status dueDate')
      .populate('projectId', 'name title status')
      .lean();
    return t ? normalizeTask(t) : null;
  },

  create: async (data) => {
    const created = await Task.create({
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    });
    const t = await Task.findById(created._id)
      .populate('assignedTo', 'username name email role')
      .populate('milestoneId', 'title status')
      .populate('projectId', 'name title status')
      .lean();
    return normalizeTask(t);
  },

  update: async (id, updateData) => {
    const updated = await Task.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )
      .populate('assignedTo', 'username name email role')
      .populate('milestoneId', 'title status')
      .populate('projectId', 'name title status')
      .lean();
    return updated ? normalizeTask(updated) : null;
  },

  delete: async (id) => {
    const res = await Task.findByIdAndDelete(id);
    return !!res;
  },
};

export default taskDao;
