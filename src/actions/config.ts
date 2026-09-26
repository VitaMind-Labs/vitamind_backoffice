export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const AUTH_ENDPOINTS = {
  SIGNIN: '/auth/signin',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  INIT_ADMIN: '/auth/init-admin',
} as const;

export const ADMIN_ENDPOINTS = {
  ROOT: '/admin',
  USERS: '/admin/users',
  SESSIONS: '/admin/sessions',
  RESPONSES: '/admin/responses',
  QUESTIONNAIRES: '/admin/questionnaires',
  QUESTIONS: '/admin/questions',
  CRISIS_EVENTS: '/admin/crisis-events',
  RISK_DETECTIONS: '/admin/risk-detections',
  PAYMENTS: '/admin/payments',
  NOTIFICATIONS: '/admin/notifications',
  DASHBOARD_STATS: '/admin/dashboard/stats',
  DASHBOARD_KPIS: '/admin/dashboard/kpis',
  DASHBOARD_RISK_OVERVIEW: '/admin/dashboard/risk-overview',
  DASHBOARD_USER_ACTIVITY: '/admin/dashboard/user-activity',
  DASHBOARD_PAYMENTS: '/admin/dashboard/payments',
  DASHBOARD_QUESTIONNAIRES: '/admin/dashboard/questionnaires',
} as const;
