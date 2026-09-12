import Project from '../models/project.model.js';

export const normalizeProject = (p) => {
  if (!p) return p;
  const doc = typeof p.toObject === 'function' ? p.toObject() : { ...p };
  const rawStatus = (doc.status || 'planning').toLowerCase();
  let status = 'planning';
  if (rawStatus.includes('prog') || rawStatus.includes('act') || rawStatus === 'in-progress' || rawStatus === 'in progress') {
    status = 'active';
  } else if (rawStatus.includes('delay') || rawStatus.includes('hold') || rawStatus === 'on-hold') {
    status = 'on-hold';
  } else if (rawStatus.includes('comp') || rawStatus === 'completed') {
    status = 'completed';
  } else if (rawStatus.includes('cancel')) {
    status = 'cancelled';
  } else if (rawStatus.includes('plan') || rawStatus.includes('appr')) {
    status = 'planning';
  }

  const name = doc.name || doc.title || 'Untitled Infrastructure Scheme';
  const budget = Number(doc.budget || 0);
  const usedbudget = Number(doc.usedbudget ?? doc.utilizedBudget ?? 0);

  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    name,
    title: name,
    description: doc.description || doc.scope || '',
    status,
    startDate: doc.startDate || doc.sanctionDate || new Date(),
    endDate: doc.endDate || doc.expectedCompletionDate || doc.targetCompletionDate || null,
    budget,
    usedbudget,
    utilizedBudget: usedbudget,
    clientId: doc.clientId && typeof doc.clientId === 'object' && doc.clientId.name
      ? doc.clientId
      : {
          _id: 'central-agency',
          name: doc.client || doc.department || doc.ministry || 'National Infrastructure Body',
          company: 'Government of India',
        },
    ownerId: doc.ownerId && typeof doc.ownerId === 'object' && (doc.ownerId.username || doc.ownerId.name)
      ? doc.ownerId
      : {
          _id: '6aa507010303c5865cc59e35',
          username: doc.responsibleOfficer || 'Executive Officer',
          name: doc.responsibleOfficer || 'Executive Officer',
          email: 'admin@gov.in',
          role: 'admin',
        },
    teamId: doc.teamId && typeof doc.teamId === 'object' && doc.teamId.name
      ? doc.teamId
      : {
          _id: 'mission-cell',
          name: doc.ministry || doc.department || 'Project Implementation Unit',
        },
    milestones: doc.milestones || [],
  };
};

export const projectDao = {
  findAll: async ({ search, status, ownerId, clientId, teamId, page = 1, limit = 50 } = {}) => {
    const filter = {};
    if (status && status !== 'ALL') {
      const sLower = status.toLowerCase();
      if (sLower === 'active') {
        filter.$or = [{ status: 'active' }, { status: { $regex: 'progress', $options: 'i' } }];
      } else if (sLower === 'on-hold') {
        filter.$or = [{ status: 'on-hold' }, { status: { $regex: 'delay', $options: 'i' } }, { status: { $regex: 'hold', $options: 'i' } }];
      } else if (sLower === 'completed') {
        filter.$or = [{ status: 'completed' }, { status: { $regex: 'complete', $options: 'i' } }];
      } else {
        filter.status = { $regex: status, $options: 'i' };
      }
    }
    if (ownerId) filter.ownerId = ownerId;
    if (clientId) filter.clientId = clientId;
    if (teamId) filter.teamId = teamId;
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { department: searchRegex },
        { ministry: searchRegex },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Project.countDocuments(filter);
    const data = await Project.find(filter)
      .populate('ownerId', 'username name email role')
      .populate('teamId', 'name members')
      .populate('clientId', 'name email company phone')
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    return { total, data: data.map(normalizeProject), page: Number(page), limit: Number(limit) };
  },

  findById: async (id) => {
    const p = await Project.findById(id)
      .populate('ownerId', 'username name email role')
      .populate('teamId', 'name members')
      .populate('clientId', 'name email company phone')
      .lean();
    return p ? normalizeProject(p) : null;
  },

  create: async (data) => {
    const created = await Project.create({
      ...data,
      name: data.name || data.title,
      title: data.title || data.name,
      usedbudget: data.usedbudget ?? data.utilizedBudget ?? 0,
      utilizedBudget: data.utilizedBudget ?? data.usedbudget ?? 0,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    });
    const populated = await Project.findById(created._id)
      .populate('ownerId', 'username name email role')
      .populate('teamId', 'name')
      .populate('clientId', 'name email company')
      .lean();
    return normalizeProject(populated);
  },

  update: async (id, updateData) => {
    const dataToUpdate = { ...updateData };
    if (updateData.usedbudget !== undefined || updateData.utilizedBudget !== undefined) {
      const val = Number(updateData.usedbudget ?? updateData.utilizedBudget ?? 0);
      dataToUpdate.usedbudget = val;
      dataToUpdate.utilizedBudget = val;
    }
    const p = await Project.findByIdAndUpdate(
      id,
      { ...dataToUpdate, updatedAt: new Date() },
      { new: true }
    )
      .populate('ownerId', 'username name email role')
      .populate('teamId', 'name')
      .populate('clientId', 'name email company')
      .lean();
    return p ? normalizeProject(p) : null;
  },

  delete: async (id) => {
    const res = await Project.findByIdAndDelete(id);
    return !!res;
  },

  countByStatus: async () => {
    const all = await Project.find({}).lean();
    const counts = {};
    all.forEach((p) => {
      const norm = normalizeProject(p);
      counts[norm.status] = (counts[norm.status] || 0) + 1;
    });
    return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
  },
};

export default projectDao;
