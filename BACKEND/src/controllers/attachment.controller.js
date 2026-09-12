import { attachmentService } from '../services/attachment.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getAttachments = asyncHandler(async (req, res) => {
  const { refType, refId } = req.query;
  const attachments = await attachmentService.getByRef(refType, refId);
  return res.status(200).json(new ApiResponse(200, attachments, 'Attachments retrieved successfully'));
});

export const getAttachmentById = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, attachment, 'Attachment retrieved successfully'));
});

export const createAttachment = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const attachment = await attachmentService.create(req.body, userId);
  return res.status(201).json(new ApiResponse(201, attachment, 'Attachment saved successfully'));
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await attachmentService.delete(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Attachment deleted successfully'));
});

export default {
  getAttachments,
  getAttachmentById,
  createAttachment,
  deleteAttachment,
};
