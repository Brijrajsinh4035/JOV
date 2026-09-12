import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const milestoneApi = {
  getByProjectId: async (projectId) => {
    return await axiosClient.get(API_ENDPOINTS.MILESTONES.BY_PROJECT(projectId));
  },

  create: async (milestoneData) => {
    return await axiosClient.post(API_ENDPOINTS.MILESTONES.BASE, milestoneData);
  },

  update: async (id, milestoneData) => {
    return await axiosClient.put(API_ENDPOINTS.MILESTONES.BY_ID(id), milestoneData);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.MILESTONES.BY_ID(id));
  },
};

export default milestoneApi;
