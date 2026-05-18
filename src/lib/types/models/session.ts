export interface Session {
  id: string;
  user_id: string;
  start_at: string;
  end_at: string | null;
  state_detected: string | null;
  wpm_avg: number | null;
  burst_ratio: number | null;
  backspace_rate: number | null;
  mouse_variance: number | null;
  scroll_speed_avg: number | null;
  color_theme_applied: string | null;
  is_crisis: boolean;
  created_at: string;
}

export interface SessionWithUser extends Session {
  user: {
    id: string;
    nickname: string;
    email?: string;
  };
}

export interface SessionFilters {
  userId?: string;
  state_detected?: string;
  is_crisis?: boolean;
  from?: string;
  to?: string;
  wpm_min?: number;
  wpm_max?: number;
  mouse_variance_min?: number;
  scroll_speed_min?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface SessionAnalytics {
  totalSessions: number;
  avgWpm: number | null;
  avgBurstRatio: number | null;
  avgBackspaceRate: number | null;
  avgMouseVariance: number | null;
  avgScrollSpeed: number | null;
}
