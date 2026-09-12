import { attachmentDao } from '../dao/attachment.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const attachmentService = {
  getByRef: async (refType, refId) => {
    if (!refType || !refId) throw new ApiError(400, 'refType and refId are required');
    return await attachmentDao.findByRef(refType, refId);
  },

  getById: async (id) => {
    const att = await attachmentDao.findById(id);
    if (!att) throw new ApiError(404, 'Attachment not found');
    return att;
  },

  create: async (data, userId) => {
    if (!data.refType || !data.refId || !data.fileName || !data.fileUrl) {
      throw new ApiError(400, 'refType, refId, fileName, and fileUrl are required');
    }
    if (!['task', 'project'].includes(data.refType)) {
      throw new ApiError(400, 'refType must be either "task" or "project"');
    }
    return await attachmentDao.create({
      ...data,
      uploadedBy: userId || data.uploadedBy,
    });
  },

  delete: async (id, userId) => {
    const existing = await attachmentDao.findById(id);
    if (!existing) throw new ApiError(404, 'Attachment not found');
    return await attachmentDao.delete(id);
  },
};

export default attachmentService;
