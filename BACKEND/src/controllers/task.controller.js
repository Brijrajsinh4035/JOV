import { taskService } from '../services/task.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getAllTasks(req.query);
  return res.status(200).json(new ApiResponse(200, tasks, 'Tasks retrieved successfully'));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  return res.status(200).json(new ApiResponse(200, task, 'Task retrieved successfully'));
});

export const createTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const task = await taskService.createTask(req.body, userId);
  return res.status(201).json(new ApiResponse(201, task, 'Task created successfully'));
});

export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const task = await taskService.updateTask(req.params.id, req.body, userId);
  return res.status(200).json(new ApiResponse(200, task, 'Task updated successfully'));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  await taskService.deleteTask(req.params.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, 'Task deleted successfully'));
});

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
