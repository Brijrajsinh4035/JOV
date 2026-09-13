import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const userApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get(API_ENDPOINTS.USERS.BASE, { params });
  },

  getById: async (id) => {
    return await axiosClient.get(API_ENDPOINTS.USERS.BY_ID(id));
  },

  create: async (data) => {
    return await axiosClient.post(API_ENDPOINTS.USERS.BASE, data);
  },

  update: async (id, data) => {
    return await axiosClient.put(API_ENDPOINTS.USERS.BY_ID(id), data);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.USERS.BY_ID(id));
  },
};

export default userApi;
