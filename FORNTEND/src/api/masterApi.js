import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const masterApi = {
  getDepartments: async () => {
    return await axiosClient.get(API_ENDPOINTS.DEPARTMENTS.BASE);
  },

  getStates: async () => {
    return await axiosClient.get(API_ENDPOINTS.STATES.BASE);
  },
};

export default masterApi;
