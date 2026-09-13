import Team from '../models/team.model.js';

export const normalizeTeam = (t) => {
  if (!t) return t;
  const doc = typeof t.toObject === 'function' ? t.toObject() : { ...t };
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    departmentId: doc.departmentId && typeof doc.departmentId === 'object'
      ? {
          ...doc.departmentId,
          _id: doc.departmentId._id?.toString() || doc.departmentId.id,
          id: doc.departmentId._id?.toString() || doc.departmentId.id,
        }
      : doc.departmentId,
    members: (doc.members || []).map((m) =>
      typeof m === 'object'
        ? {
            ...m,
            _id: m._id?.toString() || m.id,
            id: m._id?.toString() || m.id,
          }
        : m
    ),
  };
};

export const teamDao = {
  findAll: async (query = {}) => {
    const teams = await Team.find(query)
      .populate('members', 'username name email role')
      .populate('departmentId', 'name')
      .lean();
    return teams.map(normalizeTeam);
  },

  findById: async (id) => {
    const team = await Team.findById(id)
      .populate('members', 'username name email role')
      .populate('departmentId', 'name')
      .lean();
    return normalizeTeam(team);
  },

  create: async (data) => {
    const created = await Team.create({ ...data, createdAt: data.createdAt || new Date() });
    const populated = await Team.findById(created._id)
      .populate('members', 'username name email role')
      .populate('departmentId', 'name')
      .lean();
    return normalizeTeam(populated);
  },

  update: async (id, updateData) => {
    const updated = await Team.findByIdAndUpdate(id, updateData, { new: true })
      .populate('members', 'username name email role')
      .populate('departmentId', 'name')
      .lean();
    return normalizeTeam(updated);
  },

  delete: async (id) => {
    const res = await Team.findByIdAndDelete(id);
    return !!res;
  },
};

export default teamDao;
