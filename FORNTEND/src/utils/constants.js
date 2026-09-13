export const APP_CONFIG = {
  APP_NAME: 'Government Integrated Project Monitoring Platform',
  TAGLINE: 'National Infrastructure Pipeline • Central Project Monitoring System',
  VERSION: '2.0.0 (Enterprise)',
  DEFAULT_THEME: 'light',
  TOKEN_KEY: 'gov_auth_token',
  USER_KEY: 'gov_user_data',
  THEME_KEY: 'gov_theme_preference',
};

export const PROJECT_STATUS = {
  PLANNING: 'Planning',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  DELAYED: 'Delayed',
  COMPLETED: 'Completed',
};

export const STATUS_COLORS = {
  Planning: { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  Approved: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'In Progress': { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  Delayed: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  Completed: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
};
