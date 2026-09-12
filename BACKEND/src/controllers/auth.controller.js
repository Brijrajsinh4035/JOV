import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Login successful'));
});

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;
  const result = await authService.register({ username, email, password, role });
  return res
    .status(201)
    .json(new ApiResponse(201, result, 'User registered successfully'));
});

export const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Profile retrieved successfully'));
});

export const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Session terminated successfully'));
});

export default {
  login,
  register,
  getProfile,
  logout,
};
