import { notificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.query.userId;
  const notifs = await notificationService.getUserNotifications(userId);
  return res.status(200).json(new ApiResponse(200, notifs, 'Notifications retrieved successfully'));
});

export const createNotification = asyncHandler(async (req, res) => {
  const notif = await notificationService.createNotification(req.body);
  return res.status(201).json(new ApiResponse(201, notif, 'Notification created successfully'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notif = await notificationService.markAsRead(req.params.id);
  return res.status(200).json(new ApiResponse(200, notif, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.body.userId;
  await notificationService.markAllAsRead(userId);
  return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted successfully'));
});

export default {
  getMyNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
