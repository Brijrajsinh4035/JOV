import axiosClient from './axiosClient';
import { API_ENDPOINTS } from './endpoints';

export const notificationApi = {
  getAll: async () => {
    return await axiosClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
  },

  markRead: async (id) => {
    return await axiosClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllRead: async () => {
    return await axiosClient.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },

  delete: async (id) => {
    return await axiosClient.delete(API_ENDPOINTS.NOTIFICATIONS.BY_ID(id));
  },
};

export default notificationApi;
