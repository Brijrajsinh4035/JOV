import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const teamApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get(API_ENDPOINTS.TEAMS.BASE, { params });
  },

  getById: async (id) => {
    return await axiosClient.get(API_ENDPOINTS.TEAMS.BY_ID(id));
  },

  create: async (data) => {
    return await axiosClient.post(API_ENDPOINTS.TEAMS.BASE, data);
  },

  update: async (id, data) => {
    return await axiosClient.put(API_ENDPOINTS.TEAMS.BY_ID(id), data);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.TEAMS.BY_ID(id));
  },
};

export default teamApi;
