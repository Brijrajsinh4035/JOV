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
  const { name, username, email, password, role, department, designation } = req.body;
  const result = await authService.register({
    name,
    username,
    email,
    password,
    role,
    department,
    designation,
  });
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

export const sendMobileOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const result = await authService.sendMobileOtp(mobile);
  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message || 'OTP sent successfully'));
});

export const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;
  const result = await authService.verifyMobileOtp({ mobile, otp });
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Mobile OTP verified and authenticated successfully'));
});

export const resendMobileOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const result = await authService.resendMobileOtp(mobile);
  return res
    .status(200)
    .json(new ApiResponse(200, result, result.message || 'OTP resent successfully'));
});

export const verifyWidgetAuth = asyncHandler(async (req, res) => {
  const { mobile, widgetData } = req.body;
  const result = await authService.verifyWidgetAuth({ mobile, widgetData });
  return res
    .status(200)
    .json(new ApiResponse(200, result, 'MSG91 Widget authentication successful'));
});

export default {
  login,
  register,
  getProfile,
  logout,
  sendMobileOtp,
  verifyMobileOtp,
  resendMobileOtp,
  verifyWidgetAuth,
};


