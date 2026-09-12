import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const taskApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get(API_ENDPOINTS.TASKS.BASE, { params });
  },

  getById: async (id) => {
    return await axiosClient.get(API_ENDPOINTS.TASKS.BY_ID(id));
  },

  create: async (taskData) => {
    return await axiosClient.post(API_ENDPOINTS.TASKS.BASE, taskData);
  },

  update: async (id, taskData) => {
    return await axiosClient.put(API_ENDPOINTS.TASKS.BY_ID(id), taskData);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.TASKS.BY_ID(id));
  },
};

export default taskApi;
