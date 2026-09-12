import Comment from '../models/comment.model.js';

export const commentDao = {
  findByRef: async (refType, refId) => {
    return await Comment.find({ refType, refId })
      .populate('authorId', 'name username email role designation department')
      .sort({ createdAt: -1 })
      .lean();
  },

  findById: async (id) => {
    return await Comment.findById(id).populate('authorId', 'name username email role designation department').lean();
  },

  create: async (data) => {
    const created = await Comment.create({ ...data, createdAt: data.createdAt || new Date() });
    return (await Comment.findById(created._id).populate('authorId', 'name username email role designation department')).toObject();
  },

  update: async (id, updateData) => {
    return await Comment.findByIdAndUpdate(id, updateData, { new: true })
      .populate('authorId', 'name username email role designation department')
      .lean();
  },

  delete: async (id) => {
    const res = await Comment.findByIdAndDelete(id);
    return !!res;
  },
};

export default commentDao;
