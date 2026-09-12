import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const commentApi = {
  getByRef: async (refType, refId) => {
    return await axiosClient.get(API_ENDPOINTS.COMMENTS.BASE, { params: { refType, refId } });
  },

  create: async (data) => {
    return await axiosClient.post(API_ENDPOINTS.COMMENTS.BASE, data);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.COMMENTS.BY_ID(id));
  },
};

export default commentApi;
