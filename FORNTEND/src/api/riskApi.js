import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const riskApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get(API_ENDPOINTS.RISKS.BASE, { params });
  },

  getById: async (id) => {
    return await axiosClient.get(API_ENDPOINTS.RISKS.BY_ID(id));
  },

  create: async (data) => {
    return await axiosClient.post(API_ENDPOINTS.RISKS.BASE, data);
  },

  update: async (id, data) => {
    return await axiosClient.put(API_ENDPOINTS.RISKS.BY_ID(id), data);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.RISKS.BY_ID(id));
  },
};

export default riskApi;
