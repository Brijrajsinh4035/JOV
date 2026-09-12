import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const dashboardApi = {
  getStats: async () => {
    return await axiosClient.get(API_ENDPOINTS.DASHBOARD.STATS);
  },
};

export default dashboardApi;
