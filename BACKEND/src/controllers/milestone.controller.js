import { milestoneService } from '../services/milestone.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getAllMilestones = asyncHandler(async (req, res) => {
  const milestones = await milestoneService.getAllMilestones(req.query);
  return res.status(200).json(new ApiResponse(200, milestones, 'Milestones fetched successfully'));
});

export const getMilestonesByProject = asyncHandler(async (req, res) => {
  const milestones = await milestoneService.getMilestonesByProject(req.params.projectId);
  return res.status(200).json(new ApiResponse(200, milestones, 'Project milestones fetched successfully'));
});

export const getMilestoneById = asyncHandler(async (req, res) => {
  const milestone = await milestoneService.getMilestoneById(req.params.id);
  return res.status(200).json(new ApiResponse(200, milestone, 'Milestone fetched successfully'));
});

export const createMilestone = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const milestone = await milestoneService.createMilestone(req.body, userId);
  return res.status(201).json(new ApiResponse(201, milestone, 'Milestone created successfully'));
});

export const updateMilestone = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const milestone = await milestoneService.updateMilestone(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, milestone, 'Milestone updated successfully'));
});

export const deleteMilestone = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await milestoneService.deleteMilestone(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Milestone removed successfully'));
});

export default {
  getAllMilestones,
  getMilestonesByProject,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
