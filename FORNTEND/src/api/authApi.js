import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const authApi = {
  login: async (credentials) => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  register: async (userData) => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },

  getProfile: async () => {
    return await axiosClient.get(API_ENDPOINTS.AUTH.ME);
  },

  logout: async () => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  sendMobileOtp: async (mobile) => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { mobile });
  },

  verifyMobileOtp: async (mobile, otp) => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { mobile, otp });
  },

  resendMobileOtp: async (mobile) => {
    return await axiosClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { mobile });
  },

  verifyWidget: async (mobile, widgetData) => {
    return await axiosClient.post('/auth/mobile/verify-widget', { mobile, widgetData });
  },

  completeMobileProfile: async (profileData) => {
    return await axiosClient.post('/auth/mobile/complete-profile', profileData);
  },
};

export default authApi;
