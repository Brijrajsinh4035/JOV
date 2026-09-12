import Attachment from '../models/attachment.model.js';

export const attachmentDao = {
  findByRef: async (refType, refId) => {
    return await Attachment.find({ refType, refId })
      .populate('uploadedBy', 'username email role')
      .sort({ createdAt: -1 })
      .lean();
  },

  findById: async (id) => {
    return await Attachment.findById(id).populate('uploadedBy', 'username email role').lean();
  },

  create: async (data) => {
    const created = await Attachment.create({ ...data, createdAt: data.createdAt || new Date() });
    return (await Attachment.findById(created._id).populate('uploadedBy', 'username email role')).toObject();
  },

  delete: async (id) => {
    const res = await Attachment.findByIdAndDelete(id);
    return !!res;
  },
};

export default attachmentDao;
