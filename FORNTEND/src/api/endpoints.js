/**
 * Central API Endpoint Route Constants mapping to Backend APIs
 */
export const API_ENDPOINTS = {
  // Authentication & Users
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    SEND_OTP: '/auth/mobile/send-otp',
    VERIFY_OTP: '/auth/mobile/verify-otp',
    RESEND_OTP: '/auth/mobile/resend-otp',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id) => `/users/${id}`,
  },

  // Project Management
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id) => `/projects/${id}`,
    UPDATE_STATUS: (id) => `/projects/${id}/status`,
  },

  // Milestones & Tasks
  MILESTONES: {
    BASE: '/milestones',
    BY_PROJECT: (projectId) => `/milestones/project/${projectId}`,
    BY_ID: (id) => `/milestones/${id}`,
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id) => `/tasks/${id}`,
  },

  // Org, Clients & Teams
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id) => `/departments/${id}`,
  },
  CLIENTS: {
    BASE: '/clients',
    BY_ID: (id) => `/clients/${id}`,
  },
  TEAMS: {
    BASE: '/teams',
    BY_ID: (id) => `/teams/${id}`,
  },

  // Collaboration
  COMMENTS: {
    BASE: '/comments',
    BY_ID: (id) => `/comments/${id}`,
  },
  ATTACHMENTS: {
    BASE: '/attachments',
    BY_ID: (id) => `/attachments/${id}`,
  },
  TIMELOGS: {
    BASE: '/timelogs',
    BY_ID: (id) => `/timelogs/${id}`,
  },

  // Alerts, Risks, Logs & Reporting
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ_ALL: '/notifications/read-all',
    MARK_READ: (id) => `/notifications/${id}/read`,
    BY_ID: (id) => `/notifications/${id}`,
  },
  ACTIVITY_LOGS: {
    BASE: '/activityLogs',
  },
  RISKS: {
    BASE: '/risks',
    BY_ID: (id) => `/risks/${id}`,
  },
  REPORTS: {
    BASE: '/reports',
    BY_ID: (id) => `/reports/${id}`,
    SUMMARY: '/reports/summary',
    EXPORT_CSV: '/reports/export/csv',
  },

  // Dashboard & Statistics
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },

  // Government AI Project Assistant
  AI: {
    CHAT: '/ai/chat',
    SUGGESTIONS: '/ai/suggestions',
  },

  // Legacy
  STATES: {
    BASE: '/states',
  },
};

export default API_ENDPOINTS;
