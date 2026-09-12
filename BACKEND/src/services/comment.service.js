import { commentDao } from '../dao/comment.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const commentService = {
  getByRef: async (refType, refId) => {
    if (!refType || !refId) throw new ApiError(400, 'refType and refId are required');
    return await commentDao.findByRef(refType, refId);
  },

  getById: async (id) => {
    const comment = await commentDao.findById(id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    return comment;
  },

  create: async (data, userId) => {
    if (!data.refType || !data.refId || !data.text) {
      throw new ApiError(400, 'refType, refId, and text are required');
    }
    if (!['task', 'project'].includes(data.refType)) {
      throw new ApiError(400, 'refType must be either "task" or "project"');
    }
    return await commentDao.create({
      ...data,
      authorId: userId || data.authorId,
    });
  },

  update: async (id, updateData, userId) => {
    const existing = await commentDao.findById(id);
    if (!existing) throw new ApiError(404, 'Comment not found');
    return await commentDao.update(id, updateData);
  },

  delete: async (id, userId) => {
    const existing = await commentDao.findById(id);
    if (!existing) throw new ApiError(404, 'Comment not found');
    return await commentDao.delete(id);
  },
};

export default commentService;
