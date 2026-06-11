// ============================================
// Tipos compartidos del frontend
// ============================================

export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  phase: string;
  group_name: string | null;
  home_goals: number | null;
  away_goals: number | null;
  status: 'Pendiente' | 'En_Progreso' | 'Finalizado';
  is_open: boolean;
  time_remaining_ms: number | null;
  user_prediction: string | null;
  user_points: number | null;
  prediction_trends?: {
    Local: number;
    Empate: number;
    Visitante: number;
    total_bets: number;
  };
}

export interface PredictionWithMatch {
  id: number;
  user_id: number;
  match_id: number;
  prediction: 'Local' | 'Empate' | 'Visitante';
  points: number | null;
  created_at: string;
  updated_at: string;
  matches: {
    id: number;
    home_team: string;
    away_team: string;
    match_date: string;
    phase: string;
    group_name: string | null;
    home_goals: number | null;
    away_goals: number | null;
    status: string;
  };
}

export interface PredictionsResponse {
  predictions: PredictionWithMatch[];
  stats: {
    total: number;
    finished: number;
    correct: number;
    points: number;
    accuracy: number;
  };
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  total_points: number;
  correct_predictions: number;
  total_predictions: number;
  title?: string;
  has_paid?: boolean;
  streak?: 'fire' | 'ice' | null;
}

export type PredictionChoice = 'Local' | 'Empate' | 'Visitante';
export type TabType = 'partidos' | 'pronosticos' | 'ranking' | 'grupos' | 'eliminatorias' | 'admin';

