import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import departmentRoutes from './department.routes.js';
import clientRoutes from './client.routes.js';
import teamRoutes from './team.routes.js';
import projectRoutes from './project.routes.js';
import milestoneRoutes from './milestone.routes.js';
import taskRoutes from './task.routes.js';
import commentRoutes from './comment.routes.js';
import attachmentRoutes from './attachment.routes.js';
import timelogRoutes from './timelog.routes.js';
import notificationRoutes from './notification.routes.js';
import activityLogRoutes from './activityLog.routes.js';
import riskRoutes from './risk.routes.js';
import reportRoutes from './report.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import stateRoutes from './state.routes.js';

const router = Router();

// Authentication & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Core Atlas Organization & People
router.use('/departments', departmentRoutes);
router.use('/clients', clientRoutes);
router.use('/teams', teamRoutes);

// Project Delivery & Tracking
router.use('/projects', projectRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/tasks', taskRoutes);

// Collaboration & Worklogs
router.use('/comments', commentRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/timelogs', timelogRoutes);

// Governance, Alerts, Risks & Reporting
router.use('/notifications', notificationRoutes);
router.use('/activityLogs', activityLogRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/risks', riskRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

// Legacy reference routes
router.use('/states', stateRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'Project Monitoring Platform API',
    collections: [
      'users',
      'departments',
      'clients',
      'teams',
      'projects',
      'milestones',
      'tasks',
      'comments',
      'attachments',
      'timelogs',
      'notifications',
      'activityLogs',
      'risks',
      'reports',
    ],
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
