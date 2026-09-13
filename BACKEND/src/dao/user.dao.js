import User from '../models/user.model.js';

export const normalizeUser = (u) => {
  if (!u) return u;
  const doc = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  const displayName = doc.name || doc.username || 'Government Officer';
  const rawRole = (doc.role || 'manager').toLowerCase();
  const isAdmin = rawRole === 'admin' || !!doc.isAdmin;
  const role = isAdmin ? 'admin' : (rawRole === 'viewer' ? 'viewer' : 'manager');
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
    username: doc.username || displayName,
    name: displayName,
    role: role,
    isAdmin: isAdmin,
  };
};

export const userDao = {
  findAll: async (query = {}) => {
    const users = await User.find(query).select('-passwordHash -password').lean();
    return users.map(normalizeUser);
  },

  findById: async (id) => {
    const u = await User.findById(id).select('-passwordHash -password').lean();
    return u ? normalizeUser(u) : null;
  },

  findByEmailWithPassword: async (email) => {
    const u = await User.findOne({ email: email.toLowerCase() }).lean();
    return u ? normalizeUser(u) : null;
  },

  findByEmail: async (email) => {
    const u = await User.findOne({ email: email.toLowerCase() }).select('-passwordHash -password').lean();
    return u ? normalizeUser(u) : null;
  },

  findByPhone: async (phone) => {
    if (!phone) return null;
    const digits = String(phone).replace(/[^\d]/g, '');
    const last10 = digits.slice(-10);
    const u = await User.findOne({
      $or: [
        { phone: phone },
        { phone: digits },
        { phone: last10 },
        { phone: { $regex: `${last10}$` } },
      ],
    }).select('-passwordHash -password').lean();
    return u ? normalizeUser(u) : null;
  },

  create: async (userData) => {
    const created = await User.create({
      ...userData,
      createdAt: userData.createdAt || new Date(),
    });
    const obj = created.toObject();
    delete obj.passwordHash;
    delete obj.password;
    return normalizeUser(obj);
  },

  update: async (id, updateData) => {
    const updated = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-passwordHash -password')
      .lean();
    return updated ? normalizeUser(updated) : null;
  },

  delete: async (id) => {
    const res = await User.findByIdAndDelete(id);
    return !!res;
  },
};

export default userDao;
