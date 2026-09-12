import { projectService } from '../services/project.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getAllProjects(req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Projects fetched successfully'));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  return res.status(200).json(new ApiResponse(200, project, 'Project details fetched successfully'));
});

export const createProject = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const project = await projectService.createProject(req.body, userId);
  return res.status(201).json(new ApiResponse(201, project, 'Project created successfully'));
});

export const updateProject = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const project = await projectService.updateProject(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, project, 'Project updated successfully'));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const userId = req.user?._id || req.user?.id;
  const project = await projectService.updateProjectStatus(req.params.id, status, userId);
  return res.status(200).json(new ApiResponse(200, project, `Project status updated to ${status}`));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await projectService.deleteProject(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Project deleted successfully'));
});

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateStatus,
  deleteProject,
};
