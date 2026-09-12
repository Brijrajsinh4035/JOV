import Notification from '../models/notification.model.js';

export const notificationDao = {
  findByUser: async (userId) => {
    return await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  },

  create: async (data) => {
    return (
      await Notification.create({
        ...data,
        isRead: false,
        createdAt: data.createdAt || new Date(),
      })
    ).toObject();
  },

  markAsRead: async (id) => {
    return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();
  },

  markAllAsRead: async (userId) => {
    await Notification.updateMany({ userId }, { isRead: true });
    return true;
  },

  delete: async (id) => {
    const res = await Notification.findByIdAndDelete(id);
    return !!res;
  },
};

export default notificationDao;
