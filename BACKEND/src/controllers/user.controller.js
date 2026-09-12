import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.query);
  return res.status(200).json(new ApiResponse(200, users, 'Users retrieved successfully'));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'User deleted successfully'));
});

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
