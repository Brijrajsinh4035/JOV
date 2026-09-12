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
};

export default authApi;
