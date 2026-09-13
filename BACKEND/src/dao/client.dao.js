import Client from '../models/client.model.js';

export const normalizeClient = (c) => {
  if (!c) return c;
  const doc = typeof c.toObject === 'function' ? c.toObject() : { ...c };
  return {
    ...doc,
    _id: doc._id?.toString() || doc.id,
    id: doc._id?.toString() || doc.id,
  };
};

export const clientDao = {
  findAll: async (query = {}) => {
    const clients = await Client.find(query).sort({ createdAt: -1 }).lean();
    return clients.map(normalizeClient);
  },

  findById: async (id) => {
    const client = await Client.findById(id).lean();
    return normalizeClient(client);
  },

  findByEmail: async (email) => {
    const client = await Client.findOne({ email: email.toLowerCase() }).lean();
    return normalizeClient(client);
  },

  create: async (data) => {
    const created = (await Client.create({ ...data, createdAt: data.createdAt || new Date() })).toObject();
    return normalizeClient(created);
  },

  update: async (id, updateData) => {
    const updated = await Client.findByIdAndUpdate(id, updateData, { new: true }).lean();
    return normalizeClient(updated);
  },

  delete: async (id) => {
    const res = await Client.findByIdAndDelete(id);
    return !!res;
  },
};

export default clientDao;
