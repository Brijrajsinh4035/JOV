import Client from '../models/client.model.js';

export const clientDao = {
  findAll: async (query = {}) => {
    return await Client.find(query).sort({ createdAt: -1 }).lean();
  },

  findById: async (id) => {
    return await Client.findById(id).lean();
  },

  findByEmail: async (email) => {
    return await Client.findOne({ email: email.toLowerCase() }).lean();
  },

  create: async (data) => {
    return (await Client.create({ ...data, createdAt: data.createdAt || new Date() })).toObject();
  },

  update: async (id, updateData) => {
    return await Client.findByIdAndUpdate(id, updateData, { new: true }).lean();
  },

  delete: async (id) => {
    const res = await Client.findByIdAndDelete(id);
    return !!res;
  },
};

export default clientDao;
