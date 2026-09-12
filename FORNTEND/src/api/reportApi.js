import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const reportApi = {
  getSummary: async () => {
    return await axiosClient.get(API_ENDPOINTS.REPORTS.SUMMARY);
  },

  downloadCSV: () => {
    const url = `${axiosClient.defaults.baseURL}${API_ENDPOINTS.REPORTS.EXPORT_CSV}`;
    window.open(url, '_blank');
  },
};

export default reportApi;
