import { commentService } from '../services/comment.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getComments = asyncHandler(async (req, res) => {
  const { refType, refId } = req.query;
  const comments = await commentService.getByRef(refType, refId);
  return res.status(200).json(new ApiResponse(200, comments, 'Comments retrieved successfully'));
});

export const getCommentById = asyncHandler(async (req, res) => {
  const comment = await commentService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, comment, 'Comment retrieved successfully'));
});

export const createComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const comment = await commentService.create(req.body, userId);
  return res.status(201).json(new ApiResponse(201, comment, 'Comment created successfully'));
});

export const updateComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const comment = await commentService.update(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, comment, 'Comment updated successfully'));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await commentService.delete(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Comment deleted successfully'));
});

export default {
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
