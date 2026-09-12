import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const projectApi = {
  getAll: async (params = {}) => {
    return await axiosClient.get(API_ENDPOINTS.PROJECTS.BASE, { params });
  },

  getById: async (id) => {
    return await axiosClient.get(API_ENDPOINTS.PROJECTS.BY_ID(id));
  },

  create: async (projectData) => {
    return await axiosClient.post(API_ENDPOINTS.PROJECTS.BASE, projectData);
  },

  update: async (id, projectData) => {
    return await axiosClient.put(API_ENDPOINTS.PROJECTS.BY_ID(id), projectData);
  },

  updateStatus: async (id, status, remarks = '') => {
    return await axiosClient.patch(API_ENDPOINTS.PROJECTS.UPDATE_STATUS(id), { status, remarks });
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.PROJECTS.BY_ID(id));
  },
};

export default projectApi;
