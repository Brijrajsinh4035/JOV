import { notificationDao } from '../dao/notification.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const notificationService = {
  getUserNotifications: async (userId) => {
    if (!userId) throw new ApiError(400, 'User ID is required');
    return await notificationDao.findByUser(userId);
  },

  createNotification: async (data) => {
    if (!data.userId || !data.message) {
      throw new ApiError(400, 'userId and message are required');
    }
    return await notificationDao.create(data);
  },

  markAsRead: async (id) => {
    const updated = await notificationDao.markAsRead(id);
    if (!updated) throw new ApiError(404, 'Notification not found');
    return updated;
  },

  markAllAsRead: async (userId) => {
    if (!userId) throw new ApiError(400, 'User ID is required');
    return await notificationDao.markAllAsRead(userId);
  },

  deleteNotification: async (id) => {
    const deleted = await notificationDao.delete(id);
    if (!deleted) throw new ApiError(404, 'Notification not found');
    return deleted;
  },
};

export default notificationService;
